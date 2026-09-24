// Separate axios instance for the consultant portal — uses its own token
// (a completely different login/session from regular app users), so a
// consultant's session can never mix with, or be confused for, a
// regular user's session in the same browser.
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin
)

const consultantApi = axios.create({
  baseURL: API_URL,
})

consultantApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('encourage_me_consultant_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

consultantApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('encourage_me_consultant_token')
      localStorage.removeItem('encourage_me_consultant')
      if (!window.location.pathname.startsWith('/consultant/login')) {
        window.location.href = '/consultant/login'
      }
    }
    return Promise.reject(error)
  }
)

export default consultantApi
