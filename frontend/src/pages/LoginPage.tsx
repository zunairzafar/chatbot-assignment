import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

import { useAuth } from '../context/AuthContext'
import { logger } from '../lib/logger'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    logger.info('Login form submitted', { email })
    try {
      await login(email, password)
      logger.info('Login successful, navigating to dashboard', { email })
      navigate('/', { replace: true })
    } catch (err) {
      logger.error('Login failed', err)
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ??
            'Login failed. The browser could not reach the backend. Check CORS, the API URL, and the server status.',
        )
      } else {
        setError('Login failed. Check your credentials and backend connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-teal-300/90">Cyberify KB</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-300">Sign in to ask questions over your documents.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-teal-400 focus:ring-teal-400"
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
              className="w-full rounded-2xl border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-teal-400 focus:ring-teal-400"
              placeholder="••••••••"
              required
            />
          </label>

          {error ? <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-teal-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          New here?{' '}
          <Link to="/register" className="font-medium text-amber-300 hover:text-amber-200">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
