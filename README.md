# OCSKILL-FE

OCSKILL 技术知识查询系统前端，支持 PC + H5 双端适配，涵盖登录、船型/故障记录检索、记录增删改、文件上传、批量导入、用户权限管理及数据统计等功能。

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Vue 3（Options API） |
| 构建工具 | Vite 3 |
| 路由 | Vue Router 4（history 模式） |
| UI 组件库 | Element Plus |
| 网络请求 | Axios（二次封装） |
| 图表库 | ECharts |
| 流程图 | @vue-flow/core + background + controls |
| Excel 解析 | SheetJS (xlsx) + JSZip |
| 样式 | 原生 CSS / scoped（Design Tokens 见 `src/assets/theme.css`） |
| 双端适配 | 路由级 PC/H5 两套组件，按 `navigator.userAgent` 切换 |

## 功能特性

- **双端适配**：PC 与 H5 独立组件，路由层自动切换
- **权限控制**：三级权限体系（检索 / 上传编辑 / 全部管理）
- **信息检索**：按船型 + 关键词分页检索故障排查记录，支持详情/编辑/删除，关键词高亮、骨架屏与空状态插画
- **流程构建器**：拖拽搭建故障排查流程（开始/步骤/判断/结束节点），校验/预览/导入导出/提交绑定排查记录；检索详情支持"流程模式"引导式播放
- **记录管理**：单条添加 + 批量 Excel 导入，支持图片/文档上传至 OSS
- **批量上传**：拖拽 Excel 文件，自动解析文本与内嵌图片，可编辑预览后一键提交
- **数据统计**：ECharts 环形图按船型统计故障记录数量
- **用户管理**：用户列表、新增用户、修改密码、删除用户（需权限 3）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
OCSKILL-FE
├── index.html
├── package.json
├── vite.config.js
├── src
│   ├── main.js                  # 入口：Vue + Router + Element Plus
│   ├── App.vue                  # 根组件：<RouterView/>
│   ├── router/index.js          # 路由表 + 全局守卫 + 双端组件选择
│   ├── assets/                  # 静态图片、base.css、theme.css（Design Tokens）
│   ├── login/                   # 登录页（PC + H5）
│   ├── main/                    # 首页（PC + H5）
│   ├── system/                  # 系统管理页面
│   │   ├── SystemLayout.vue     #   PC 框架（深色侧边栏 + 顶部栏）
│   │   ├── SystemLayoutH5.vue   #   H5 框架（顶部栏 + TabBar）
│   │   ├── Retrieval.vue        #   信息检索（PC）
│   │   ├── RetrievalH5.vue      #   信息检索（H5）
│   │   ├── AddRecord.vue        #   添加记录（PC）
│   │   ├── AddRecordH5.vue      #   添加记录（H5）
│   │   ├── BatchUpload.vue      #   批量上传（PC）
│   │   ├── Mine.vue             #   个人中心（PC）
│   │   ├── MineH5.vue           #   个人中心（H5）
│   │   ├── DataStatistics.vue   #   数据统计（PC）
│   │   ├── UserManagement.vue   #   用户管理（PC）
│   │   ├── FlowBuilder.vue      #   流程构建器（PC）
│   │   └── flow/
│   │       ├── FlowNode.vue     #     画布自定义节点
│   │       └── FlowRunner.vue   #     流程播放器（构建器预览/检索详情复用）
│   └── utils/
│       ├── request.js           # Axios 封装：注入 Token、处理 401
│       ├── token.js             # localStorage 管理 Token/用户名/权限
│       ├── uploadQueue.js       # 全局上传队列（串行 + 200ms 节流）
│       ├── file.js              # OSS 源文件删除
│       └── flowSchema.js        # 排查流程数据结构：节点工厂/校验/导入导出
```

## 核心配置

### 开发代理（vite.config.js）

开发环境所有 `/api` 请求代理到 `https://oceanskill.top`，生产环境由部署服务器或 Nginx 反向代理。

### 请求封装（src/utils/request.js）

- `baseURL: '/api'`，`timeout: 15000`
- 请求拦截：自动在 Header 注入 `Token`
- 响应拦截：HTTP 401 时清除登录态并跳转 `/login`

### 本地存储（src/utils/token.js）

| Key | 说明 |
|---|---|
| `ocskill_token` | 登录 Token |
| `ocskill_username` | 用户名 |
| `ocskill_privilege` | 权限等级（1/2/3） |

## 路由与双端适配

路由模式为 `createWebHistory`，双端切换在 `router/index.js` 中根据 `navigator.userAgent` 一次性决定加载 PC 或 H5 组件。

| 路径 | 名称 | 说明 | 权限要求 |
|---|---|---|---|
| `/` | MainPage | 首页入口 | - |
| `/login` | LoginPage | 登录 | - |
| `/system/retrieval` | RetrievalPage | 信息检索 | - |
| `/system/add` | AddRecordPage | 添加记录 | - |
| `/system/batch-upload` | BatchUploadPage | 批量上传 | privilege = 3 |
| `/system/mine` | MinePage | 个人中心 | - |
| `/system/statistics` | DataStatisticsPage | 数据统计 | privilege = 3 |
| `/system/users` | UserManagementPage | 用户管理 | privilege = 3 |
| `/system/flow-builder` | FlowBuilderPage | 流程构建器 | privilege >= 2 |

## 权限等级

| 权限值 | 说明 |
|---|---|
| `1` | 仅检索 |
| `2` | 检索 + 上传/编辑 + 流程构建器 |
| `3` | 全部权限（删除、批量上传、新增用户、数据统计、用户管理） |

## API 接口

| 接口 | 方法 | 用途 |
|---|---|---|
| `/login` | POST | 登录，返回 token/username/privilege |
| `/users` | GET | 查询用户列表（分页） |
| `/users` | POST | 新增用户 |
| `/users` | PUT | 修改密码 |
| `/ships` | GET | 获取船型列表 |
| `/ships` | PUT | 新增船型 |
| `/trbsts` | GET | 检索排查记录（分页 + 关键词） |
| `/trbsts` | POST | 编辑保存排查记录 |
| `/trbsts` | DELETE | 删除排查记录 |
| `/trbsts` | PUT | 新增排查记录 |
| `/trbsts/batch` | POST | 批量上传排查记录 |
| `/trbsts/addflow` | PUT | 为排查记录绑定流程文件 |
| `/upload` | POST | 文件/图片上传（返回 OSS 链接） |
| `/reports/trbstCount` | GET | 按船型统计故障记录数量 |

## 上传规则

- 图片：单张 < 2MB，每条记录最多 9 张，支持 `image/*`
- 文档：单个 < 2MB，支持 `.pdf` / `.doc` / `.docx`
- 批量上传：Excel 解析跳过表头，列顺序为 船型 → 故障现象 → 排查步骤 → 照片，内嵌图片自动提取并上传

## 主题设计

全站采用「深海蓝 · 工程感知识工具」设计体系（v2.0），所有颜色/圆角/阴影/字阶统一通过 `src/assets/theme.css` 的 CSS 变量引用，禁止硬编码色值。

| 用途 | 变量 / 色值 |
|---|---|
| 品牌主色 | `--oc-blue-600` `#2563EB`（hover `#1D4ED8`） |
| 侧边栏/品牌区 | `--oc-navy-900 → --oc-navy-800`（`#0B1B36 → #10254A`） |
| 页面背景 | `--oc-gray-50` `#F8FAFC` |
| 标题/正文/辅助文字 | `--oc-gray-900 / 700 / 500-400` |
| 成功 / 警告 / 危险 | `#10B981 / #F59E0B / #EF4444` |

详细设计规范见 `docs/OCSKILL-UI重设计方案.md`，项目结构与业务说明见 `PROJECT_CONTEXT.md`。

## License

MIT
