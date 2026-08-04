# OCSKILL-FE 系统 UI 统一美化方案

## Context（背景与目标）

### 现状问题
当前系统 UI 风格割裂严重：
- **PC 端**：BatchUpload/UserManagement 重度使用 element-plus，视觉现代；而 Retrieval/AddRecord/Mine/FlowBuilder 混用大量自定义弹窗/按钮；home/SystemLayout/login/DataStatistics 完全没用 element-plus。
- **H5 端**：6 个页面全部手写原生 HTML + CSS，详情弹窗还是蓝色渐变头 + 简陋卡片，与 PC 端视觉割裂。
- **重复造轮子**：每个页面都自写一套 `.modal-overlay`/`.btn-cancel`/`.alert-dialog`，样式漂移、维护成本高。
- **无主题变量**：`base.css` 是 vue-cli 默认模板，项目主色 `#3584e4`/`#1a5fb4`/`#1a3a6e`/`#f5f7fa` 在每个文件硬编码重复。

### 目标
1. PC 端统一到 element-plus（弹窗、按钮、表单、下拉、分页、提示），消除自定义弹窗组件
2. H5 端不引入 element-plus（移动端体验差），但提取共用 CSS 主题变量、详情弹窗卡片化、按钮统一渐变蓝，与 PC 端视觉协调
3. 建立项目主题色变量系统，消除硬编码
4. 统一提示为 ElMessage / ElMessageBox，删除所有自定义 .alert-overlay

### 技术前提（已确认）
- `src/main.js` 已全量注册 element-plus（`app.use(ElementPlus)`），可直接在 template 用 `<el-button>` 等，无需额外 import
- 未安装 `@element-plus/icons-vue`，图标不继续用 SVG（探索更美观，更专业的icon）
- 现有 element-plus 范式参考：[UserManagement.vue](file:///h:/Develop/git-ocsk/OCSK-FE/src/system/UserManagement.vue)、[BatchUpload.vue](file:///h:/Develop/git-ocsk/OCSK-FE/src/system/BatchUpload.vue)

---

## 核心策略

### 替换映射表（PC 端）

| 自定义元素 | 替换为 | 说明 |
|---|---|---|
| `.modal-overlay` + `.modal-dialog` | `<el-dialog>` | v-model 控制显隐，#footer 放按钮 |
| `.btn-cancel` / `.btn-submit` / `.btn-delete` / `.btn-search` | `<el-button>` | type=primary/default/danger |
| `.alert-overlay` + `.alert-dialog`（提示弹框） | `ElMessage` / `ElMessageBox` | 删除整个组件 |
| 原生 `<input>` / `<textarea>` | `<el-input>` | type=text/textarea |
| `.ship-selector`（自定义下拉） | `<el-select>` + `<el-option>` | filterable 可选 |
| `.pagination-wrap` / `.page-btn` / `.size-option` | `<el-pagination>` | background small |
| `.ship-dropdown` / `.keyword-modal` | `<el-select>` / `<el-dialog>` | - |

### 保留不动的元素
- FlowBuilder 画布（@vue-flow/core 自带样式）
- DataStatistics 的 ECharts 容器
- SystemLayout 侧边栏/顶部栏布局结构（仅按钮换 el-button）
- home/login 宣传图大背景
- 检索结果卡片（业务卡片，无对应 element-plus 组件）

### H5 端策略
- **不引入 element-plus**（移动端弹窗/表单体验差）
- 引用主题 CSS 变量统一配色
- 详情弹窗卡片化（与 PC 端我刚优化的视觉风格一致：白色头部 + 卡片区块 + 圆环步骤 + 文件卡片）
- `showAlert()` 全部改用 `ElMessage`（element-plus 已全局注册，H5 也能用 ElMessage）
- 弹窗头部从蓝色渐变改为白色 + 底部细线（与 PC 端一致）
- 按钮统一渐变蓝风格

---

## 分批执行计划

工程涉及 10+ PC 文件 + 6 H5 文件，分三批执行。**本次先执行第一批**，验收后再继续后续批次，降低风险。

---

### 第一批：PC 端通用组件统一（本次执行）

最高 ROI：消除重复弹窗/按钮/提示组件，统一交互体验。

#### 1.1 建立主题 CSS 变量
新建 `src/assets/theme.css`，定义项目主题变量：
```css
:root {
  --oc-primary: #3584e4;
  --oc-primary-dark: #1a5fb4;
  --oc-primary-deeper: #14478a;
  --oc-title: #1a3a6e;
  --oc-text: #46587a;
  --oc-text-light: #8a94a6;
  --oc-bg: #f5f7fa;
  --oc-bg-soft: #fafbfc;
  --oc-border: #eef1f6;
  --oc-success: #19be6b;
  --oc-warning: #ff9900;
  --oc-danger: #ed4014;
  --oc-radius: 10px;
  --oc-radius-lg: 12px;
}
```
在 `main.js` 中 import。后续批次逐步把各文件硬编码颜色替换为变量。

#### 1.2 Retrieval.vue 改造
**文件**：[src/system/Retrieval.vue](file:///h:/Develop/git-ocsk/OCSK-FE/src/system/Retrieval.vue)

- **删除 `.alert-overlay` 提示弹框**：删除 template 中的 `alert-overlay`/`alert-dialog`/`alertBox` data 字段；`showAlert(msg)` 方法改为 `ElMessage({ message: msg, type: 'warning' })`（ElMessage 已 import）
- **关键词弹窗 → el-dialog**：`.modal-overlay.keyword-modal` → `<el-dialog v-model="showKeywordModal" title="管理关键词" width="500px" :close-on-click-modal="false" append-to-body>`，footer 用 `#footer` slot 放 el-button
- **编辑弹窗 → el-dialog**：`.modal-overlay.edit-modal` → `<el-dialog>`，标题副信息用 `#header` slot 自定义
- **删除确认弹窗 → ElMessageBox.confirm**：删除 `showDeleteConfirm`/`confirmDelete` 的自定义弹窗，改为 `ElMessageBox.confirm('确定删除该排查记录吗？删除后不可恢复。', '提示', { type: 'warning' }).then(() => {...})`
- **船型选择器 → el-select**：`.ship-selector`/`.ship-dropdown` → `<el-select v-model="selectedShipId" placeholder="请选择船型" @change="onShipChange">` + `<el-option>`
- **分页 → el-pagination**：`.pagination-wrap`/`.page-btn`/`.size-option` → `<el-pagination v-model:current-page="currentPage" :page-size="pageSize" :page-sizes="[5,10,20,50]" layout="total, sizes, prev, pager, next" background small @current-change="onPageChange" @size-change="onSizeChange" />`
- **搜索按钮 → el-button**：`.btn-search` → `<el-button type="primary" @click="handleSearch">检索</el-button>`
- **卡片编辑/删除按钮 → el-button**：`.card-btn` → `<el-button size="small" type="primary" text>` / `<el-button size="small" type="danger" text>`
- 删除上述自定义元素对应的 CSS

#### 1.3 AddRecord.vue 改造
**文件**：[src/system/AddRecord.vue](file:///h:/Develop/git-ocsk/OCSK-FE/src/system/AddRecord.vue)

- **删除 `.alert-overlay` 提示弹框**：改用 ElMessage
- **船型选择器 → el-select**
- **表单输入 → el-input**：`.phenomenon-input`/`.step-input` → `<el-input type="textarea">` / `<el-input>`
- **提交按钮 → el-button**：`.btn-submit-large` → `<el-button type="primary" size="large">`
- **步骤添加/删除按钮 → el-button**（text 类型）
- 保留自定义的图片预览/文件列表样式（el-upload 集成成本高，暂保留）

#### 1.4 Mine.vue 改造
**文件**：[src/system/Mine.vue](file:///h:/Develop/git-ocsk/OCSK-FE/src/system/Mine.vue)

- **删除 `.alert-overlay` 提示弹框**：改用 ElMessage / ElMessageBox.confirm
- **退出登录确认弹窗 → ElMessageBox.confirm**
- **退出按钮 → el-button**

#### 1.5 FlowBuilder.vue 改造
**文件**：[src/system/FlowBuilder.vue](file:///h:/Develop/git-ocsk/OCSK-FE/src/system/FlowBuilder.vue)

- FlowBuilder 已用 el-dialog/el-button/el-select，主要清理：
- **删除残留的自定义按钮**（若有）→ el-button
- 保留画布、节点、属性面板的自定义样式（业务定制）

---

### 第二批：PC 端简单页面统一（后续执行）

- **home.vue**：退出按钮、进入系统按钮 → el-button
- **SystemLayout.vue**：退出按钮、折叠按钮 → el-button
- **login.vue**：登录按钮 → el-button（保留自定义背景图）
- **DataStatistics.vue**：若有按钮 → el-button；图表容器保留

### 第三批：H5 端风格统一（后续执行）

- 在 `src/assets/theme.css` 中补充 H5 专用变量（如 H5 弹窗圆角、TabBar 高度等）
- **RetrievalH5.vue**：
  - 详情弹窗卡片化（白色头部 + 卡片区块 + 圆环步骤 + 文件卡片），与 PC 端视觉一致
  - 图片改用 `<el-image>` 预览（element-plus 全局可用）
  - `showAlert()` → `ElMessage`
  - 弹窗头部从蓝色渐变改白色 + 底部细线
  - 按钮统一渐变蓝
- **AddRecordH5.vue**：按钮统一、showAlert → ElMessage
- **MineH5.vue**：按钮统一、showAlert → ElMessage
- **SystemLayoutH5.vue**：顶部栏配色用变量
- **login_h5.vue / home_h5.vue**：按钮统一
- 保留 H5 特有交互：底部弹出式选择器（船型）、底部 TabBar、触摸友好的大按钮

---

## 验证方式

### 第一批验证（本次）
1. `npm run build` 构建无报错
2. `npm run dev` 启动开发服务器
3. 浏览器登录后逐一验证：
   - **检索页**：船型下拉、关键词弹窗、分页、编辑弹窗、删除确认、提示消息
   - **新增记录页**：船型选择、表单输入、提交按钮
   - **个人中心**：退出确认
   - **流程构建器**：按钮交互
4. 验证要点：
   - 所有弹窗为 el-dialog 风格（圆角、阴影、动画）
   - 所有按钮为 el-button 风格
   - 无 `.alert-overlay` 残留
   - 无 `.modal-overlay` 残留（除保留项）
   - ElMessage 提示正常显示
   - 功能完全正常（增删改查、上传、分页）

---

## 风险与对策

| 风险 | 对策 |
|---|---|
| el-dialog 层级冲突（多个弹窗嵌套） | 使用 `append-to-body` 属性 |
| el-select 下拉选项数据格式不匹配 | 转换 shipList 字段（shipId→value, name→label） |
| el-pagination 事件与原逻辑不一致 | 注意 @current-change/@size-change 参数，重构 fetchData 触发逻辑 |
| 删除自定义 CSS 可能影响保留元素 | 谨慎删除，仅删被替换元素的 CSS |
| showAlert 改 ElMessage 后 type 不对 | 统一映射：错误→error，警告→warning，成功→success |

---

## 不做的事（明确排除）

- 不引入 vant/其他移动端组件库
- 不重构 FlowBuilder 画布逻辑
- 不改 ECharts 图表配置
- 不改 SystemLayout 侧边栏布局结构
- 不动 home/login 宣传图背景
- 本次不执行第二、三批（验收后再启动）
