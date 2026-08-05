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
| UI 组件库 | Element Plus + @element-plus/icons-vue（全局注册） |
| 网络请求 | Axios（二次封装在 `src/utils/request.js`） |
| 图表库 | ECharts（用于数据统计页面） |
| 流程图 | @vue-flow/core + background + controls（流程构建器画布，需 vue>=3.3） |
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
│   ├── assets
│   │   ├── base.css            # 全局重置与 body 基础样式
│   │   ├── theme.css           # 全局主题变量（v2.0 Design Tokens + el-* 组件主题覆盖）
│   │   └── ...                 # 静态图片（备案图标、小程序码等）
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
│   │   ├── UserManagement.vue  # PC 用户管理（权限 3 可见）
│   │   ├── FlowBuilder.vue     # PC 流程构建器（拖拽搭建排查流程，权限 >=2）
│   │   └── flow
│   │       ├── FlowNode.vue    # 画布自定义节点（start/step/decision/end）
│   │       └── FlowRunner.vue  # 流程播放器（引导式排查，构建器预览/检索详情复用）
│   └── utils
│       ├── request.js          # Axios 封装：注入 Token、处理 401
│       ├── token.js            # localStorage 操作 Token/用户名/权限
│       ├── uploadQueue.js      # 全局上传队列（串行 + 200ms 节流，POST /upload 得 OSS 链接）
│       ├── file.js             # OSS 源文件删除（DELETE /upload?objects=）
│       ├── theme.js            # 时段主题：getTimeTheme/getGreeting/getGreetingIcon
│       └── flowSchema.js       # 排查流程数据结构：节点工厂/校验/导入导出/id 重生成
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
| `/system/flow-builder` | FlowBuilderPage | FlowBuilder.vue | 流程构建器（PC 独有，privilege>=2） |

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
| `/trbsts` | GET | 检索排查记录（分页 + 关键词，响应行含 `flowUrl` 流程文件地址） | Retrieval、RetrievalH5、FlowBuilder |
| `/trbsts` | POST | 编辑保存排查记录 | Retrieval |
| `/trbsts` | DELETE | 删除排查记录 | Retrieval |
| `/trbsts` | PUT | 新增排查记录 | AddRecord |
| `/trbsts/batch` | POST | 批量上传排查记录（请求体为对象数组） | BatchUpload |
| `/trbsts/addflow` | PUT | 为排查记录绑定流程文件（请求体 `{ id, flowUrl }`） | FlowBuilder |
| `/upload` | POST | 文件/图片上传 | Retrieval、AddRecord、BatchUpload |
| `/reports/trbstCount` | GET | 按船型统计故障记录数量 | DataStatistics |

---

## 8. 业务页面说明

### 8.1 登录页
- 用户名 + 密码登录。
- **UI 组件**：`el-input`（带 User/Lock 前缀图标 + 显示密码功能）、`el-button` primary 登录按钮、`el-link` 游客登录。
- 成功写入 `token/username/privilege`，跳转 `/`。

### 8.2 首页
- 展示用户名、退出按钮、宣传图。
- "进入系统" 跳转 `/system/retrieval`。
- ~~PC 首页的"新增用户"入口已删除~~，统一迁移至系统管理-用户管理；H5 首页（home_h5.vue）仍保留"新增用户"按钮（`privilege === 3` 可见），直接调用 `POST /users`。
- **UI 组件**：`el-button` 退出登录（`ElMessageBox.confirm` 二次确认）、`el-button` type="success" 进入系统按钮。

### 8.3 信息检索（Retrieval）
- 选择船型、关键词检索。
- 分页展示结果卡片。
- 编辑需 `privilege >= 2`，删除需 `privilege >= 3`。
- 支持详情弹窗、编辑弹窗、图片/文档上传。
- **UI 组件**：`el-select` 船型选择、`el-button` 检索/编辑/删除、`el-pagination` 分页、`el-dialog` 关键词/详情/编辑弹窗、`el-image` 图片预览、`ElMessage` / `ElMessageBox` 提示与确认。
- **弹窗固定高度**：详情弹窗和编辑弹窗固定高度 600px，内容区 `overflow-y: auto` 滚动（非 scoped 全局样式覆盖，因 `append-to-body` 导致 scoped 无法穿透）。
- **步骤序号样式**：编辑弹窗中排查步骤序号采用浅蓝底 + 蓝色描边圆环（`--oc-primary-bg` 背景 + `--oc-primary` 边框），非蓝色渐变实心圆。
- **文档附件命名**：详情页文档附件统一显示"文件 1、文件 2"序号，不显示原始文件名。
- **流程模式（P2）**：详情弹窗中，若该记录 `flowUrl` 非空，顶部显示「图文模式 | 流程模式」Tab；切到流程模式时懒加载 `flowUrl` → `parseFlow` 解析 → 用 `FlowRunner` 播放（状态机引导式排查，支持上一步/重新开始）。PC 与 H5 双端均支持，逻辑一致。
- **删除记录清理**：删除排查记录时，连同其 `photo`、`doc`、`flowUrl` 指向的 OSS 源文件一并调用 `deleteFiles` 清理，避免孤儿文件。

### 8.4 添加记录（AddRecord）
- 选择船型、填写故障现象、排查步骤。
- 上传图片（最多 9 张，单张 < 2M）和文档（单个 < 2M）。
- `privilege < 2` 时提交禁用。
- **UI 组件**：`el-select` 船型选择、`el-input` type="textarea" 故障现象、`el-dialog` 添加船型弹窗、`el-button` 提交/取消。

### 8.5 个人中心（Mine）
- 展示用户名、权限等级、权限说明。
- 退出登录。
- **UI 组件**：`el-button` 退出登录（`ElMessageBox.confirm` 二次确认）、`ElMessage` 提示。

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
- **UI 组件**：CSS 全部引用 `theme.css` 主题变量（`--oc-title`、`--oc-text-light`、`--oc-bg-white`、`--oc-radius`、`--oc-shadow`）。

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

### 8.9 流程构建器（FlowBuilder）
- **仅 PC 页面**，`privilege >= 2` 可见（路由守卫 + 侧边栏菜单 requiredPrivilege: 2）。
- 路径：`/system/flow-builder`。
- 用途：拖拽搭建"故障排查流程"（开始/步骤/判断/结束 4 种节点 + 连线），导出/导入 JSON 流程文件；构建器内可校验、预览（FlowRunner 播放器）。
- **UI 组件**：`el-button` 工具栏按钮（全屏/校验/预览/导出/导入/提交/新建）、`el-input` 流程名/描述、`el-radio-group` 已解决/未解决、`el-dialog` 各类弹窗、Element Plus 图标（FullScreen、Check、Upload、Download、Plus、Delete 等）。
- **顶部驱动（重构后）**：工具栏含「关联船型」+「排查记录」两个必选下拉；右侧面板仅保留流程名/描述/统计。未选船型+记录时画布被蒙层遮罩不可交互。
  - 选船型 → 拉取 `/trbsts?shipId=&pageSize=100` 候选记录（每条含 `flowUrl/photo/doc`）。
  - 选排查记录：有 `flowUrl` → `fetch` 下载 → `parseFlow` → 加载到画布（失败降级新建）；无 `flowUrl` → 新建空流程绑定该记录。
  - 切换船型/记录、清空记录时若有未提交编辑弹二次确认；"新建"按钮改为重置回未选择状态。
  - 草稿：仅当草稿含已绑定船型+记录时才恢复，否则进入未选择空状态。
- 数据结构（flowSchema.js，`version: "1.0.0"`）：
  - 顶层：`version/id/name/shipId/shipName/bindTrbstId/description/author/createTime/updateTime/canvas{zoom,offsetX,offsetY}/nodes[]/edges[]`。
  - 节点公共字段：`id/type/label/description/position{x,y}/media{photos[],docs[]}`；`decision` 额外 `question/options[{id,label}]`；`end` 额外 `result{resolved,conclusion,suggestion}`。
  - 连线：`id/source/target/sourceOption(decision 分支必填，= 选项 id)/label`；**跳转全部由 edges 表达，节点内不存目标 id**。
- 校验规则（validateFlow）：流程名非空、**必须选择关联船型**、恰好 1 个开始节点、≥1 个结束、start/step 恰 1 条出边、decision ≥2 选项且每选项已连线、end 无出边且结论非空、无悬空边、从开始节点全图可达。
- 关联船型：GET /ships 返回 `{id, name}`，前端映射为 `{shipId, name}`（与 Retrieval 一致）。
- 绑定排查记录：顶部选船型后下拉按故障现象选择（不手填 id）；已绑定记录不在列表时保留 `#id` 占位回显。
- 导入：parseFlow 做 schema 校验 + version 主版本兼容检查，`regenerateIds` 重生成所有节点/选项/连线 id 防冲突；损坏文件给出具体错误。
- 导出前强制校验；导出文件名 `flow_{名称}_{yyyyMMdd}.json`。
- 提交：工具栏"提交"按钮，**提交前必须绑定故障排查记录**（validateFlow 的 requireBindTrbst 选项，导出/预览不强制）。流程：序列化流程 JSON（文件名 `flow_{名称}_{yyyyMMddHHmmss}.flow.json`）→ `uploadFile` 上传得 OSS 链接 → `PUT /trbsts/addflow`（请求体 `{ id: bindTrbstId, flowUrl }`）。
  - **旧文件清理**：PUT 成功后，若该记录原 `flowUrl` 存在且与新地址不同，调用 `deleteFiles` 清理旧流程文件（best-effort，失败仅告警）；并同步本地记录列表的 `flowUrl`，保证下次提交能正确清理本次文件。
  - **失败回滚**：PUT 失败或异常时回滚新上传文件；旧文件不动，记录仍指向旧流程。
- 草稿：编辑自动防抖保存 localStorage `ocskill_flow_draft`，进入页面自动恢复；"新建"需二次确认并清草稿。
- 附件：节点图片/文档复用 `uploadQueue.uploadFile`（限制同 AddRecord：图 ≤9 张 <2M，文档 pdf/doc/docx <2M）；删除附件时调用 `deleteFiles` 清理 OSS。**节点附件支持"从排查记录选择"**：图片/文档区各有按钮，弹窗从当前绑定排查记录的 `photo`/`doc` 中勾选追加（去重 + 数量上限校验）。
- 开始节点自动创建，不可删除、不可重复添加；判断节点选项 2~6 个，选项文字修改自动同步对应连线文字，删除选项级联删除其连线。
- FlowRunner（src/system/flow/FlowRunner.vue）：接收 flow 对象按状态机执行（start/step 沿唯一出边、decision 按选项找 edge、history 栈支持上一步、end 展示结论可重开）；图片用 el-image 预览。**P2 已复用到 PC/H5 检索详情"流程模式"**：详情弹窗 `flowUrl` 非空时显示图文/流程 Tab，切流程模式懒加载 `flowUrl` → `parseFlow` → FlowRunner。
- 详细设计见 `docs/故障排查流程构建器设计方案.md`。

---

## 9. UI 设计规范

> 2026-08 全站 UI 重设计（「深海蓝 · 工程感知识工具」）后，本节以 v2.0 token 体系为准。详细方案见 `docs/OCSKILL-UI重设计方案.md`。

### 9.1 主题变量系统（`src/assets/theme.css`，v2.0）

所有页面统一通过 CSS 变量引用主题色，禁止硬编码颜色值。

**品牌色阶 + 中性色阶 + 语义色**：

```css
:root {
  /* 品牌蓝（主操作/链接/选中态）：--oc-blue-50 ~ --oc-blue-900 */
  --oc-blue-600: #2563EB;   /* 主色 */
  --oc-blue-700: #1D4ED8;   /* hover */
  /* 深海军蓝（侧边栏/登录品牌区）：--oc-navy-700/800/900/950（#0B1B36 为主底色） */
  --oc-cyan-500: #06B6D4;   /* 海洋感点缀，仅图表/标签装饰 */
  /* 中性灰阶（界面骨架）：--oc-gray-50(页面底) ~ --oc-gray-900(标题) */
  /* 语义色 */
  --oc-success: #10B981;  --oc-success-bg: #ECFDF5;
  --oc-warning: #F59E0B;  --oc-warning-bg: #FFFBEB;
  --oc-danger:  #EF4444;  --oc-danger-bg:  #FEF2F2;  /* 禁止再用 #ed4014 */
  --oc-info:    #64748B;  --oc-info-bg:    #F1F5F9;
}
```

**旧变量兼容层（保留变量名、仅改值，旧页面无需改名）**：

```css
:root {
  --oc-primary:         var(--oc-blue-600);
  --oc-primary-dark:    var(--oc-blue-700);
  --oc-primary-light:   var(--oc-blue-400);
  --oc-primary-lighter: var(--oc-blue-200);
  --oc-primary-bg:      var(--oc-blue-50);
  --oc-title:           var(--oc-gray-900);
  --oc-text:            var(--oc-gray-700);
  --oc-text-light:      var(--oc-gray-400);
  --oc-bg:              var(--oc-gray-50);
  --oc-bg-white:        #FFFFFF;
  --oc-bg-soft:         var(--oc-gray-100);
  --oc-border:          var(--oc-gray-200);
}
```

**圆角 / 阴影 / 字阶 / 间距**：

```css
:root {
  --oc-radius-sm: 6px;  --oc-radius: 8px;  --oc-radius-md: 12px;  --oc-radius-lg: 16px;
  /* 阴影为灰蓝色调（rgba(15,23,42,*)），不用纯黑阴影 */
  --oc-shadow-sm / --oc-shadow / --oc-shadow-lg / --oc-shadow-hover;
  --oc-card-border: 1px solid var(--oc-gray-200);  /* 卡片 = 1px 描边 + 最轻阴影 */
  /* 字阶：12/13/14/16/18/22/28（--oc-text-xs ~ --oc-text-3xl），数字启用 tnum 等宽 */
  /* 间距一律 4 的倍数：4/8/12/16/20/24/32/40/48；过渡 150~200ms ease */
}
```

theme.css 同时通过 `--el-*` 变量整体换肤 Element Plus（主色/文字/边框/圆角/阴影），并对 el-button / el-input / el-dialog / el-table / el-pagination / el-message 做组件级微调，确保与项目配色一致。

### 9.2 组件统一规范

| 场景 | PC 端 | H5 端 |
|---|---|---|
| 按钮 | `el-button`（统一样式，禁止自定义 button） | 渐变蓝自定义按钮（`--oc-primary` → `--oc-primary-dark`） |
| 输入框 | `el-input` / `el-input type="textarea"` | 自定义 input（引用 `--oc-border` / `--oc-bg-soft`） |
| 下拉选择 | `el-select` | 自定义底部弹出选择器 |
| 弹窗 | `el-dialog`（`append-to-body`） | 自定义卡片式弹窗（白色头部 + 底部细线） |
| 分页 | `el-pagination` | 自定义分页 |
| 提示 | `ElMessage` / `ElMessageBox` | `ElMessage` / `ElMessageBox`（两端统一） |
| 图标 | `@element-plus/icons-vue`（全局注册） | 不使用图标组件 |
| 图片预览 | `el-image`（`preview-src-list`） | `el-image`（`preview-src-list`） |
| 退出确认 | `ElMessageBox.confirm` | `ElMessageBox.confirm` |

### 9.3 弹窗规范

- **固定高度**：详情弹窗和编辑弹窗固定高度 `600px`，内容区 `overflow-y: auto` 滚动。
- **实现方式**：因 `el-dialog` 使用 `append-to-body`，scoped 样式无法穿透，需在文件末尾添加非 scoped `<style>` 块，通过 `.detail-dialog` / `.edit-dialog` 类名直接覆盖。
- **关闭按钮**：统一使用 `el-dialog` 原生右上角 × 按钮，不使用自定义关闭按钮。
- **卡片式详情**：PC 和 H5 详情弹窗均采用白色头部 + 卡片区块 + 圆环步骤序号风格。

### 9.4 文档附件命名

- 详情页文档附件统一显示"文件 1、文件 2"序号，不显示原始文件名。

### 9.5 步骤序号样式

- 编辑弹窗中排查步骤序号采用**浅蓝底 + 蓝色描边圆环**（`--oc-primary-bg` 背景 + `--oc-primary` 边框 + `--oc-primary-dark` 文字），不使用蓝色渐变实心圆。

### 9.6 图标使用

- 所有图标使用 `@element-plus/icons-vue`，通过 `markRaw()` 注册到组件 data 中避免 Vue 将其变为响应式对象。
- 全局注册方式：在 `main.js` 中遍历 `ElementPlusIconsVue` 并 `app.component(key, component)`。
- 内联小图标（空状态插画、附件标识等）使用 SVG，不使用 emoji。

### 9.7 时段主题（清晨/白日/傍晚/夜晚）

- **机制**：`src/utils/theme.js` 按小时返回 `morning(5-11) / day(11-17) / dusk(17-19) / night(19-5)`；组件根元素加 `theme-{name}` class，`theme.css` 中同名 class 覆盖一组 `--oc-hero-*` / `--oc-sidebar-*` / `--oc-banner-*` 变量实现换肤（`:root` 默认 = 夜晚）。
- **问候语**：`getGreeting()` 含"早上好/傍晚好"；问候语旁 SVG 图标：太阳（光芒 30s 缓转）/ 黄昏半日（呼吸光晕）/ 弯月（呼吸光晕）。
- **首页装饰按主题显隐**：夜晚=星星+流星+声呐+海浪；清晨/白日=白云漂移（隐星空）；傍晚=半沉落日+剪影飞鸟+暗淡早星（隐流星），海浪染暖橙。
- **侧边栏**：清晨/白日换浅色皮肤（白底+深文字+右侧分隔线）；傍晚为靛紫渐变；星星仅夜晚/傍晚显示。
- **系统框架整体联动**（SystemLayout 根节点挂主题 class）：顶栏 `--oc-topbar-*`（傍晚深靛紫/夜晚深海军蓝/白天白色），内容区底色 `--oc-content-bg`（白天极浅蓝、傍晚微暖灰、夜晚冷调蓝灰）；原则=主题色做画框、工作区保明亮。
- **个人中心横幅**：随主题换渐变（清晨亮蓝/白日深蓝/傍晚紫橙/夜晚海军蓝）；装饰同步切换——白天白云漂移、傍晚小落日+飞鸟+淡星、夜晚星星；头像声呐脉冲环全主题保留。
- 所有动画均有 `prefers-reduced-motion` 兜底。

### 9.8 流程构建器皮肤（FlowBuilder / FlowNode / FlowRunner）

- **工具栏**：白底 56px，按钮按「文件组（新建/导入/导出）｜视图校验组（全屏/校验/预览）｜提交组」分组，组间 1px 竖分隔线。
- **节点四色**：start 绿（`--oc-success`）/ step 蓝（`--oc-blue-600`）/ decision 紫（`#8B5CF6`）/ end 灰（`--oc-gray-500`）；FlowNode 头部浅底色条与 FlowRunner 类型徽章保持一致。
- **节点卡片**：1.5px `--oc-gray-200` 边框 + 10px 圆角 + `--oc-shadow-sm`；选中态边框 `--oc-blue-600` + 3px `--oc-blue-100` 外发光。
- **画布**：点阵 `#E2E8F0`、间距 20px；未选船型/记录时蒙层 `rgba(248,250,252,.85)` + 居中空状态插画。
- **全屏模式**：退出按钮固定在画布右上角（`right: calc(var(--fb-panel-w) + 28px)`），避开右侧属性面板，不遮挡"删除节点"按钮。

---

## 10. 系统布局（SystemLayout）

### 10.1 PC 端（SystemLayout.vue）
- 左侧渐变蓝侧边栏（`--oc-primary-lighter` → `--oc-primary-light`）+ 右侧主内容区。
- 侧边栏菜单项：`el-button` 返回首页（plain 风格）、`el-button` 圆形折叠按钮（Menu 图标）。
- 顶部栏：`el-button` 退出登录（`ElMessageBox.confirm` 二次确认）。
- 侧边栏配色、标题色、边框色均引用 `theme.css` 主题变量。

### 10.2 H5 端（SystemLayoutH5.vue）
- 顶部栏渐变蓝（`--oc-primary` → `--oc-primary-dark`）+ 底部 TabBar。
- 顶部栏配色引用主题变量。

---
