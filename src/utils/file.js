import request from './request'

/**
 * 删除 OSS 源文件（按地址批量删除）
 * 调用后端 DELETE /upload?objects=url1,url2
 * 失败时仅控制台告警，不阻断主流程（源文件清理为副作用操作）
 * @param {string|string[]} urls 文件地址，单个或数组
 * @returns {Promise}
 */
export function deleteFiles(urls) {
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean)
  if (list.length === 0) return Promise.resolve()
  return request.delete('/upload', { params: { objects: list.join(',') } })
    .then(res => {
      if (res.data && res.data.code !== 1) {
        console.warn('源文件删除失败：', res.data.msg)
      }
    })
    .catch(err => {
      console.warn('源文件删除请求异常：', err)
    })
}
