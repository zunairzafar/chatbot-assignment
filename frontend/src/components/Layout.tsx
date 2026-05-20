import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { logger } from '../lib/logger'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-hero-grid text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 shadow-glow backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-teal-300/90">Cyberify KB</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Full-stack AI knowledge base</h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                Signed in as <span className="font-medium text-white">{user?.email ?? 'user'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logger.info('Logout button clicked')
                  logout()
                }}
                className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20"
              >
                Logout
              </button>
            </div>
          </div>
          <nav className="mt-5 flex gap-3 text-sm text-slate-300">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${isActive ? 'bg-teal-400 text-slate-950' : 'bg-white/5 hover:bg-white/10'}`
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
