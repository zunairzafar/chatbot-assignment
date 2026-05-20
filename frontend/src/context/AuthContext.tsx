import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import api from '../lib/api'
import { clearStoredToken, getStoredToken, storeToken } from '../lib/auth'
import { logger } from '../lib/logger'

export type AuthUser = {
  id: string
  email: string
  created_at: string
}

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'cyberify-kb-user'

function getStoredUser(): AuthUser | null {
  const rawValue = localStorage.getItem(USER_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthUser
  } catch {
    return null
  }
}

function storeAuthState(nextToken: string, nextUser: AuthUser) {
  storeToken(nextToken)
  localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
}

function clearAuthState() {
  clearStoredToken()
  localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken())
  const [user, setUser] = useState<AuthUser | null>(getStoredUser())

  logger.debug('Auth provider initialized', { hasToken: Boolean(token), hasUser: Boolean(user) })

  useEffect(() => {
    if (!token) {
      setUser(null)
    }
  }, [token])

  async function authenticate(endpoint: '/auth/login' | '/auth/register', email: string, password: string) {
    logger.info('Auth request started', { endpoint, email })
    const response = await api.post(endpoint, { email, password })
    const nextToken = response.data.access_token as string
    const nextUser = response.data.user as AuthUser
    storeAuthState(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
    logger.info('Auth request succeeded', { endpoint, userId: nextUser.id, email: nextUser.email })
  }

  async function login(email: string, password: string) {
    await authenticate('/auth/login', email, password)
  }

  async function register(email: string, password: string) {
    await authenticate('/auth/register', email, password)
  }

  function logout() {
    logger.info('User logout requested', { userId: user?.id, email: user?.email })
    clearAuthState()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: Boolean(token), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
