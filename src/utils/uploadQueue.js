import request from './request'

// 全局上传队列：保证所有 /upload 请求串行 + 节流，避免触发后端每秒5次的速率限制
let uploadQueue = Promise.resolve()
let lastUploadTime = 0
const MIN_INTERVAL = 200 // 最小请求间隔 200ms，确保每秒不超过5次

/**
 * 上传文件到服务端（获取 OSS 链接）
 * 通过全局串行队列 + 节流，保证所有上传请求（不论来自哪个组件）
 * 都按顺序执行且间隔至少 200ms，避免触发后端速率限制
 * @param {File} file 文件对象
 * @returns {Promise<string>} OSS 链接
 */
export function uploadFile(file) {
  const doUpload = () => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => {
      if (res.data.code === 1 && res.data.data) {
        return res.data.data
      }
      throw new Error(res.data.msg || '上传失败')
    })
  }

  // 节流：确保两次请求间隔至少 200ms
  const throttledUpload = () => {
    const now = Date.now()
    const elapsed = now - lastUploadTime
    const delay = elapsed >= MIN_INTERVAL ? 0 : (MIN_INTERVAL - elapsed)
    return new Promise(resolve => {
      setTimeout(resolve, delay)
    }).then(() => {
      lastUploadTime = Date.now()
      return doUpload()
    })
  }

  // 加入全局队列串行执行
  const result = uploadQueue.then(throttledUpload)
  // 无论成功失败，都要让队列继续，避免后续请求被阻塞
  uploadQueue = result.then(() => undefined, () => undefined)
  return result
}
