type SourceChunkCardProps = {
  filename: string
  chunkText: string
  pageNumber?: number | null
  score?: number | null
}

import { logger } from '../lib/logger'

export function SourceChunkCard({ filename, chunkText, pageNumber, score }: SourceChunkCardProps) {
  logger.debug('Rendering source chunk card', { filename, pageNumber, hasScore: typeof score === 'number' })
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-glow backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal-300">{filename}</p>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            {pageNumber ? `Page ${pageNumber}` : 'Chunk source'}
          </p>
        </div>
        {typeof score === 'number' ? (
          <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
            Score {score.toFixed(3)}
          </span>
        ) : null}
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-200">{chunkText}</p>
    </article>
  )
}
