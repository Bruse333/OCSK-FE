# OCSKILL-FE 项目长期约定

## 技术栈
Vue 3（Options API，已升 3.5.x，>=3.3 是 @vue-flow 要求）+ Vite 3 + Vue Router 4（history）+ Element Plus + Axios + ECharts + xlsx + JSZip + @vue-flow/core。样式用原生 CSS + scoped，不用 CSS 框架。

## 双端适配
PC/H5 两套组件，router/index.js 里按 navigator.userAgent 一次性决定（isMobile()）。新页面默认要写 PC + H5 两个版本并登记到路由；PC 独有页面（批量上传/数据统计/用户管理/流程构建器）无需 H5 版。

## 请求与鉴权
- 统一用 src/utils/request.js（baseURL '/api'，自动注入 `Token` 头，401 自动清登录态跳 /login）。
- localStorage keys：ocskill_token / ocskill_username / ocskill_privilege，操作走 src/utils/token.js。
- 后端响应格式：`{ code: 1, msg, data }`，code===1 为成功。
- 权限：1 仅检索，2 检索+上传/编辑，3 全部。路由守卫：batch-upload/statistics/users 仅 privilege===3，flow-builder 需 >=2。

## 数据模型
排查记录：`{ shipId, phenomenon, shooting, photo: [url], doc: [url] }`；新增 PUT /trbsts，编辑 POST /trbsts，批量 POST /trbsts/batch。
上传一律走 src/utils/uploadQueue.js 的 uploadFile(file)（全局串行 + 200ms 节流，防后端限流），删除附件用 src/utils/file.js 的 deleteFiles(url) 清 OSS。
排查流程（flow.json v1.0.0）见 src/utils/flowSchema.js：4 种节点 start/step/decision/end，跳转全部由 edges[] 表达（decision 出边带 sourceOption=选项 id），节点不存目标 id；FlowRunner.vue 为播放器（构建器预览/检索详情复用）。

## UI 约定
- 主色 #3584e4 / 深蓝 #1a5fb4 / 浅蓝 #5FB0E6、#87CEEB；背景 #f5f7fa，卡片 #fff，标题文字 #1a3a6e。
- 提示统一 ElMessage / ElMessageBox / ElNotification。
- 新页面弹窗用 el-dialog；旧 PC 页面（如 Retrieval）保留自定义 .modal-overlay + .modal-dialog。
- PC 系统页挂在 SystemLayout（侧边栏可折叠，keep-alive）；H5 挂 SystemLayoutH5（顶部栏 + TabBar）。
- 菜单权限通过 SystemLayout 的 menuItems 里 requiredPrivilege 控制。
