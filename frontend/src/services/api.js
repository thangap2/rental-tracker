import axios from 'axios'
import { useAppStore } from '@/stores/app'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const appStore = useAppStore()
    appStore.setLoading(true)
    
    // Ensure auth header is set if token exists
    const token = localStorage.getItem('token')
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    const appStore = useAppStore()
    appStore.setLoading(false)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const appStore = useAppStore()
    appStore.setLoading(false)
    return response
  },
  (error) => {
    const appStore = useAppStore()
    appStore.setLoading(false)
    
    // Handle common error responses
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear auth state and redirect to login
          console.log('401 error - clearing auth state')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          delete api.defaults.headers.common['Authorization']
          
          // Don't redirect if we're already on login page
          if (!window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login'
          }
          break
        case 403:
          appStore.showError('You are not authorized to perform this action')
          break
        case 404:
          appStore.showError('The requested resource was not found')
          break
        case 500:
          appStore.showError('Internal server error. Please try again later.')
          break
        default:
          appStore.showError(
            error.response.data?.message || 'An unexpected error occurred'
          )
      }
    } else if (error.request) {
      appStore.showError('Unable to connect to the server. Please check your internet connection.')
    } else {
      appStore.showError('An unexpected error occurred')
    }
    
    return Promise.reject(error)
  }
)

export default api
