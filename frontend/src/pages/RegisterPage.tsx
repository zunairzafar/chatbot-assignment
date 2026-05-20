import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

import { useAuth } from '../context/AuthContext'
import { logger } from '../lib/logger'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    logger.info('Register form submitted', { email })
    try {
      await register(email, password)
      logger.info('Registration successful, navigating to dashboard', { email })
      navigate('/', { replace: true })
    } catch (err) {
      logger.error('Registration failed', err)
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ??
            'Registration failed. The browser could not reach the backend. Check CORS, the API URL, and the server status.',
        )
      } else {
        setError('Registration failed. Check your backend connection and password length.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300/90">Cyberify KB</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Create your account</h2>
        <p className="mt-2 text-sm text-slate-300">Register once and start indexing your PDFs and text files.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-300 focus:ring-amber-300"
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-300 focus:ring-amber-300"
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </label>

          {error ? <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-teal-300 hover:text-teal-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
