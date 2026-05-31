import axios from 'axios'
import { getValidToken, redirectToLogin } from './authService'

const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getValidToken()
  config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: { response?: { status: number }; config: { _retry?: boolean; headers: { Authorization: string } } }) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      try {
        const token = await getValidToken()
        error.config.headers.Authorization = `Bearer ${token}`
        return axiosInstance(error.config)
      } catch {
        redirectToLogin()
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
