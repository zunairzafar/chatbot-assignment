import { FormEvent, useEffect, useRef, useState } from 'react'

import api from '../lib/api'
import { SourceChunkCard } from '../components/SourceChunkCard'
import { logger } from '../lib/logger'

type DocumentItem = {
  id: string
  filename: string
  enabled: boolean
  created_at: string
}

type AskResponse = {
  answer: string
  prompt: string
  sources: Array<{
    id: string
    document_id: string
    filename: string
    chunk_index: number
    page_number?: number | null
    chunk_text: string
    score?: number | null
    created_at: string
  }>
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AskResponse['sources']
}

export function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content: 'Upload a PDF or TXT file, enable the documents you want searched, then ask me a question.',
    },
  ])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  async function loadDocuments() {
    setDocumentsLoading(true)
    try {
      const response = await api.get<{ documents: DocumentItem[] }>('/documents')
      setDocuments(response.data.documents)
      logger.info('Documents loaded', { count: response.data.documents.length })
    } catch (err) {
      logger.error('Failed to load documents', err)
      setError('Unable to load documents. Check the backend connection and your session.')
    } finally {
      setDocumentsLoading(false)
    }
  }

  useEffect(() => { void loadDocuments() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) { setError('Choose a PDF or TXT file first.'); return }
    setBusy(true); setError(''); setUploadStatus('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadStatus(`${response.data.filename} uploaded with ${response.data.chunk_count} chunk(s).`)
      setFile(null)
      await loadDocuments()
    } catch (err) {
      logger.error('Upload failed', err)
      setError('Upload failed. Confirm the backend is running and you are authenticated.')
    } finally {
      setBusy(false)
    }
  }

  async function handleQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!question.trim()) { setError('Enter a question first.'); return }
    setBusy(true); setError('')
    try {
      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: question.trim() }
      setMessages((m) => [...m, userMessage])
      const response = await api.post<AskResponse>('/ask', { question })
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources,
      }
      setMessages((m) => [...m, assistantMessage])
      setQuestion('')
    } catch (err) {
      logger.error('Question request failed', err)
      setError('Question answering failed. Confirm documents exist and the backend is reachable.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleDocument(documentId: string, enabled: boolean) {
    try {
      const response = await api.patch(`/documents/${documentId}/enabled`, null, { params: { enabled } })
      setDocuments((docs) => docs.map((d) => d.id === documentId ? { ...d, enabled: response.data.enabled } : d))
    } catch (err) {
      logger.error('Failed to toggle document state', err)
      setError('Unable to update the document state right now.')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`/documents/${deleteTarget.id}`)
      setDocuments((docs) => docs.filter((d) => d.id !== deleteTarget.id))
      logger.info('Document deleted', { id: deleteTarget.id })
    } catch (err) {
      logger.error('Failed to delete document', err)
      setError('Failed to delete document.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const activeDocumentCount = documents.filter((d) => d.enabled).length

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-[2rem] border border-rose-400/20 bg-slate-900 p-8 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-rose-400">Warning</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Delete "{deleteTarget.filename}"?</h3>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              This will permanently delete the document and all its embeddings from the database.
              To use it again you will need to re-upload and re-index it, which will consume compute resources.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-400"
              >
                Delete permanently
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300/90">Chat</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Talk to your bot</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Only enabled documents are searched during retrieval. The Hugging Face model answers using the top matching chunks.
            </p>
          </div>
          <div className="rounded-2xl border border-teal-400/20 bg-teal-400/10 px-4 py-3 text-sm text-teal-100">
            {activeDocumentCount} enabled / {documents.length} total documents
          </div>
        </div>

        <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-4">
          <div className="max-h-[32rem] space-y-4 overflow-y-auto pr-2">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-[1.5rem] px-4 py-3 shadow-lg ${message.role === 'user' ? 'bg-amber-400 text-slate-950' : 'border border-white/10 bg-white/8 text-slate-100'}`}>
                  <p className="text-xs uppercase tracking-[0.3em] opacity-70">{message.role === 'user' ? 'You' : 'Bot'}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <form className="mt-4 flex flex-col gap-3" onSubmit={handleQuestion}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="Ask anything about your enabled documents..."
              className="w-full rounded-3xl border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-300 focus:ring-amber-300"
            />
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Enter to send, shift + enter for a new line</p>
              <button type="submit" disabled={busy} className="rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70">
                {busy ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </form>
        </div>

        {messages.slice().reverse().find((m) => m.role === 'assistant' && m.sources?.length) ? (
          <div className="mt-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-teal-300/90">Sources</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Latest retrieved chunks</h3>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {messages.slice().reverse().find((m) => m.role === 'assistant' && m.sources?.length)?.sources?.map((chunk) => (
                <SourceChunkCard key={chunk.id} filename={chunk.filename} chunkText={chunk.chunk_text} pageNumber={chunk.page_number} score={chunk.score} />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-teal-300/90">Ingestion</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Upload PDFs and text files</h2>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleUpload}>
            <label className="block rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-6">
              <span className="block text-sm font-medium text-slate-200">Choose a document</span>
              <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-teal-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-teal-300" />
            </label>
            <button type="submit" disabled={busy} className="rounded-2xl bg-teal-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70">
              {busy ? 'Processing...' : 'Upload and index'}
            </button>
          </form>
          {uploadStatus ? <p className="mt-4 rounded-2xl border border-teal-400/20 bg-teal-400/10 px-4 py-3 text-sm text-teal-100">{uploadStatus}</p> : null}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300/90">Documents</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Toggle RAG sources</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs text-slate-300">
              {documentsLoading ? 'Refreshing...' : 'Live'}
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {documents.length ? (
              documents.map((document) => (
                <div key={document.id} className="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{document.filename}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
                        {document.enabled ? 'Included in RAG' : 'Excluded from RAG'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleDocument(document.id, !document.enabled)}
                        className={`relative inline-flex h-10 w-20 items-center rounded-full border transition ${document.enabled ? 'border-teal-400/30 bg-teal-400/20' : 'border-white/10 bg-slate-800/80'}`}
                        aria-pressed={document.enabled}
                      >
                        <span className={`inline-block h-8 w-8 transform rounded-full bg-white shadow transition ${document.enabled ? 'translate-x-10' : 'translate-x-1'}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(document)}
                        className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
