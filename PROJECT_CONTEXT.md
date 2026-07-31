# OCSKILL-FE 项目上下文文档

本文档用于快速了解项目结构、代码逻辑与开发约定，方便后续向 AI 提出开发需求时直接引用。

---

## 1. 项目概述

- **项目名称**：OCSKILL-FE
- **用途**：OCSKILL 技术知识查询系统前端（PC + H5 双端）
- **核心功能**：登录、船型/故障记录检索、故障记录新增/编辑/删除、文件上传、用户权限管理、数据统计。

---

## 2. 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Vue 3（Options API） |
| 构建工具 | Vite 3 |
| 路由 | Vue Router 4（history 模式） |
| UI 组件库 | Element Plus |
| 网络请求 | Axios（二次封装在 `src/utils/request.js`） |
| 图表库 | ECharts（用于数据统计页面） |
| Excel 解析 | xlsx（解析 .xlsx/.xls 表格文本，用于批量上传） |
| ZIP 解析 | JSZip（提取 xlsx 内嵌图片，用于批量上传） |
| 样式 | 原生 CSS / `scoped` |
| 双端适配 | 路由级 PC/H5 两套组件，按 `navigator.userAgent` 切换 |

---

## 3. 目录结构

```
OCSKILL-FE
├── index.html
├── package.json
├── vite.config.js
├── src
│   ├── main.js                 # 入口：Vue + Router + Element Plus
│   ├── App.vue                 # 仅 <RouterView/>
│   ├── router
│   │   └── index.js            # 路由表 + 全局守卫 + 双端组件选择
│   ├── assets                  # 静态图片、基础样式
│   ├── components              # 默认示例组件（未参与业务）
│   ├── login
│   │   ├── login.vue           # PC 登录
│   │   └── login_h5.vue        # H5 登录
│   ├── main
│   │   ├── home.vue            # PC 首页
│   │   └── home_h5.vue         # H5 首页
│   ├── system
│   │   ├── SystemLayout.vue    # PC 系统页框架（侧边栏 + 顶部栏）
│   │   ├── SystemLayoutH5.vue  # H5 系统页框架（顶部栏 + TabBar）
│   │   ├── Retrieval.vue       # PC 检索页
│   │   ├── RetrievalH5.vue     # H5 检索页
│   │   ├── AddRecord.vue       # PC 添加记录
│   │   ├── AddRecordH5.vue     # H5 添加记录
│   │   ├── Mine.vue            # PC 个人中心
│   │   ├── MineH5.vue          # H5 个人中心
│   │   ├── BatchUpload.vue     # PC 批量上传（Excel 导入排查记录，权限 3 可见）
│   │   ├── DataStatistics.vue  # PC 数据统计（故障记录饼图）
│   │   └── UserManagement.vue  # PC 用户管理（权限 3 可见）
│   └── utils
│       ├── request.js          # Axios 封装：注入 Token、处理 401
│       └── token.js            # localStorage 操作 Token/用户名/权限
```

---

## 4. 核心配置

### 4.1 Vite 代理（`vite.config.js`）

```js
server: {
  proxy: {
    '/api': {
      target: 'https://oceanskill.top',
      changeOrigin: true,
    }
  }
}
```

- 开发环境所有 `/api` 请求代理到 `https://oceanskill.top`。
- 生产环境默认仍走 `/api`，由部署服务器或 Nginx 反向代理。

### 4.2 请求封装（`src/utils/request.js`）

```js
baseURL: '/api'
timeout: 15000
```

- 请求拦截：自动在 Header 中注入 `Token`（`Token: ${token}`）。
- 响应拦截：HTTP 401 时清除登录态并跳转 `/login`。

### 4.3 本地存储（`src/utils/token.js`）

| Key | 说明 |
|---|---|
| `ocskill_token` | 登录 Token |
| `ocskill_username` | 用户名 |
| `ocskill_privilege` | 权限等级（1/2/3） |

---

## 5. 路由与双端适配

- 路由模式：`createWebHistory`。
- 双端切换在 `router/index.js` 中根据 `navigator.userAgent` 一次性决定 PC 或 H5 组件。
- 路由守卫：未登录跳 `/login`；`/system/batch-upload`、`/system/statistics` 与 `/system/users` 仅 `privilege === 3` 可访问。

### 路由表

| 路径 | 名称 | 组件 | 说明 |
|---|---|---|---|
| `/` | MainPage | home.vue / home_h5.vue | 首页入口 |
| `/login` | LoginPage | login.vue / login_h5.vue | 登录 |
| `/system/retrieval` | RetrievalPage | Retrieval.vue / RetrievalH5.vue | 信息检索 |
| `/system/add` | AddRecordPage | AddRecord.vue / AddRecordH5.vue | 添加记录 |
| `/system/mine` | MinePage | Mine.vue / MineH5.vue | 个人中心 |
| `/system/batch-upload` | BatchUploadPage | BatchUpload.vue | 批量上传（PC 独有） |
| `/system/statistics` | DataStatisticsPage | DataStatistics.vue | 数据统计（PC 独有） |
| `/system/users` | UserManagementPage | UserManagement.vue | 用户管理（PC 独有） |

---

## 6. 权限等级

| 权限值 | 说明 |
|---|---|
| `1` | 仅检索 |
| `2` | 检索 + 上传/编辑 |
| `3` | 全部权限（可删除、新增用户、查看系统管理-批量上传/数据统计/用户管理） |

---

## 7. API 接口清单

| 接口 | 方法 | 用途 | 涉及页面 |
|---|---|---|---|
| `/login` | POST | 登录，返回 token/username/privilege | login |
| `/users` | GET | 查询用户列表（支持 username/pageNum/pageSize） | UserManagement |
| `/users` | POST | 新增用户（需 privilege=3） | UserManagement、home_h5 |
| `/users` | PUT | 修改密码（username/password/newPassword） | UserManagement |
| `/users` | DELETE | 删除用户（按 id） | UserManagement |
| `/ships` | GET | 获取船型列表 | Retrieval、AddRecord、BatchUpload |
| `/ships` | PUT | 新增船型 | AddRecord |
| `/trbsts` | GET | 检索排查记录（分页 + 关键词） | Retrieval |
| `/trbsts` | POST | 编辑保存排查记录 | Retrieval |
| `/trbsts` | DELETE | 删除排查记录 | Retrieval |
| `/trbsts` | PUT | 新增排查记录 | AddRecord |
| `/trbsts/batch` | POST | 批量上传排查记录（请求体为对象数组） | BatchUpload |
| `/upload` | POST | 文件/图片上传 | Retrieval、AddRecord、BatchUpload |
| `/reports/trbstCount` | GET | 按船型统计故障记录数量 | DataStatistics |

---

## 8. 业务页面说明

### 8.1 登录页
- 用户名 + 密码登录。
- 成功写入 `token/username/privilege`，跳转 `/`。

### 8.2 首页
- 展示用户名、退出按钮、宣传图。
- "进入系统" 跳转 `/system/retrieval`。
- ~~PC 首页的"新增用户"入口已删除~~，统一迁移至系统管理-用户管理；H5 首页（home_h5.vue）仍保留"新增用户"按钮（`privilege === 3` 可见），直接调用 `POST /users`。

### 8.3 信息检索（Retrieval）
- 选择船型、关键词检索。
- 分页展示结果卡片。
- 编辑需 `privilege >= 2`，删除需 `privilege >= 3`。
- 支持详情弹窗、编辑弹窗、图片/文档上传。

### 8.4 添加记录（AddRecord）
- 选择船型、填写故障现象、排查步骤。
- 上传图片（最多 9 张，单张 < 2M）和文档（单个 < 2M）。
- `privilege < 2` 时提交禁用。

### 8.5 个人中心（Mine）
- 展示用户名、权限等级、权限说明。
- 退出登录。

### 8.6 数据统计（DataStatistics）
- **仅 PC 页面**，仅 `privilege === 3` 可见。
- 路径：`/system/statistics`。
- 使用 ECharts 绘制"故障记录统计图"饼状图。
- 数据接口：`GET /reports/trbstCount`。
- 响应格式：
  ```json
  {
    "code": 1,
    "msg": "success",
    "data": [
      { "name": "Dolphin3", "value": 4 },
      { "name": "SL40", "value": 1 },
      { "name": "测试船型", "value": 3 }
    ]
  }
  ```
- 图表左上角显示"故障记录总数：{value 之和}"。
- 加载时显示 ECharts loading 动画，渲染后使用弹性缩放动画。
- 所有提示使用 `ElMessage`。

### 8.7 用户管理（UserManagement）
- **仅 PC 页面**，仅 `privilege === 3` 可见。
- 路径：`/system/users`。
- 表格字段：用户名、使用者、创建时间、权限标签、操作栏。
- 操作栏：修改密码、删除用户。
- 表格上方：按 `username` 搜索表单 + "+ 新增用户"按钮。
- 新增用户弹窗：用户名、密码、姓名、权限下拉框（1/2/3）。
- 修改密码弹窗：当前密码、新密码，校验新密码不能与当前密码相同。
- 删除用户：二次确认弹窗。
- 底部分页条：每页 10/20/50 可选，页码/页码切换时重新请求后端。
- 后端接口：
  - 列表：`GET /users?username={keyword}&pageNum={page}&pageSize={size}`，返回 `{ code: 1, data: { total, rows } }`。
  - 新增：`POST /users`，请求体 `{ username, password, name, privilege }`。
  - 修改密码：`PUT /users`，请求体 `{ username, password, newPassword }`。
  - 删除：`DELETE /users?id={id}`，二次确认弹窗后调用。
- 返回的 `createTime`（ISO 格式，如 `2026-06-14T11:07:18`）会格式化为 `2026-06-14 11:07:18` 展示。
- 所有提示/确认统一使用 `ElMessage` / `ElMessageBox`。

### 8.8 批量上传（BatchUpload）
- **仅 PC 页面**，仅 `privilege === 3` 可见（侧边栏"系统管理"子菜单）。
- 路径：`/system/batch-upload`。
- 通过拖拽/点击上传 Excel 文件（.xlsx/.xls）批量导入故障排查记录，支持预览、编辑后一键提交。
- Excel 列顺序：船型、故障现象、排查步骤、照片（表头第一行跳过）。
- 解析流程：`xlsx` 解析表格文本，`JSZip` 提取 xlsx 内嵌图片（按 drawing 锚点的 `from.row` 行号分组对应到数据行）。
- 解析后展示可编辑表格：船型（下拉匹配，未匹配高亮提示）、故障现象、排查步骤、照片、文件。
- 照片：最多 9 张，单张 < 2M；文件：仅 .pdf/.doc/.docx，单个 < 2M；均自动调用 `POST /upload` 获取 OSS 链接。
- 分页条：每页 10/20/50/100 可选。
- 提交校验：船型必选、现象/步骤非空、所有文件上传完成；提交数据模型与 AddRecord 一致：`{ shipId, phenomenon, shooting, photo: [url], doc: [url] }`。
- 提交接口：`POST /trbsts/batch`，请求体为上述对象数组；成功（`code === 1`）后清空表格并回到第一页；提交期间按钮 loading；失败提示 `ElMessage.error`。
- 所有提示/确认统一使用 `ElMessage` / `ElMessageBox`。

---

- 主色调：
  - 主蓝：`#3584e4`
  - 深蓝：`#1a5fb4`
  - 浅蓝：`#5FB0E6`、`#87CEEB`
  - 成功绿：`#19be6b`
  - 警告橙：`#ff9900`
  - 错误红：`#ed4014`
- 背景色：页面 `#f5f7fa`，卡片 `#fff`。
- 标题文字：`#1a3a6e`。
- 提示：统一使用 `ElMessage` / `ElNotification` / `ElMessageBox`。
- 弹窗：新页面统一使用 Element Plus 的 `el-dialog`；旧 PC 页面仍保留自定义 `.modal-overlay` + `.modal-dialog` 结构。

---
