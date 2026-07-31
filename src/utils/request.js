// axios 请求实例，统一注入 Token 请求头并处理 401
import axios from 'axios'
import { getToken, removeToken, removeUsername, removePrivilege } from './token'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截器：自动在请求头中注入 Token
request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Token'] = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理 401 未认证
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      removeToken()
      removeUsername()
      removePrivilege()
      import('@/router').then(module => {
        const router = module.default
        if (router) {
          router.push('/login')
        } else {
          window.location.href = '/login'
        }
      }).catch(() => {
        window.location.href = '/login'
      })
    }
    return Promise.reject(error)
  }
)

export default request
