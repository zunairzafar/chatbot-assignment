import axios from 'axios'

import { getStoredToken } from './auth'
import { logger } from './logger'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  logger.debug('HTTP request', { method: config.method, url: config.url })
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    logger.debug('HTTP response', { status: response.status, url: response.config.url })
    return response
  },
  (error) => {
    logger.error('HTTP error', {
      status: error?.response?.status,
      url: error?.config?.url,
      message: error?.message,
    })
    return Promise.reject(error)
  },
)

export default api
