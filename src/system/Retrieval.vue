<template>
  <div class="retrieval-page">
    <!-- 搜索区域 -->
    <div class="search-card">
      <div class="search-row">
        <!-- 船型选择 -->
        <div class="field-group">
          <label class="field-label">船型</label>
          <el-select
            v-model="selectedShipId"
            placeholder="请选择船型"
            clearable
            class="ship-select"
            @change="onShipChange"
          >
            <el-option
              v-for="item in shipList"
              :key="item.shipId"
              :label="item.name"
              :value="item.shipId"
            />
          </el-select>
        </div>

        <!-- 关键词 -->
        <div class="field-group keyword-group">
          <label class="field-label">关键词</label>
          <div class="keyword-content" @click="openKeywordModal">
            <div class="keyword-tags" v-if="keywords.length > 0">
              <span v-for="(kw, i) in keywords" :key="i" class="kw-tag">
                {{ kw }}
                <span class="kw-tag-close" @click.stop="removeKeyword(i)">×</span>
              </span>
            </div>
            <span class="keyword-placeholder" v-else>点击添加</span>
            <el-icon class="keyword-add-icon"><Plus /></el-icon>
          </div>
        </div>

        <!-- 搜索按钮 -->
        <div class="search-btn-wrap">
          <el-button type="primary" size="large" :icon="Search" @click="handleSearch">检索</el-button>
        </div>
      </div>
    </div>

    <!-- 结果区域 -->
    <div class="result-section">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="state-box">
        <div class="spinner"></div>
        <p class="state-text">正在检索...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!hasSearched" class="state-box">
        <p class="state-text">请选择船型后进行检索</p>
      </div>

      <div v-else-if="resultList.length === 0" class="state-box">
        <p class="state-text">暂无检索结果</p>
      </div>

      <template v-else>
        <!-- 统计 -->
        <div class="result-stat">
          共 {{ total }} 条结果，第 {{ currentPage }}/{{ totalPages }} 页
        </div>

        <!-- 卡片列表 -->
        <div class="result-list">
          <div
            v-for="(item, index) in resultList"
            :key="item.id"
            class="result-card"
          >
            <div class="card-header" @click="openDetail(index)">
              <span class="card-name">{{ item.name }}</span>
              <span class="card-date">{{ item.createTimeStr }}</span>
            </div>
            <div class="card-body" @click="openDetail(index)">
              <div class="card-section">
                <span class="card-label">故障现象</span>
                <span class="card-phenomenon">{{ item.phenomenon }}</span>
              </div>
              <div class="card-section">
                <span class="card-label">排查步骤</span>
                <span class="card-shooting">{{ item.shootingPreview }}</span>
              </div>
            </div>
            <div class="card-footer">
              <div class="card-actions">
                <el-button
                  size="small"
                  type="primary"
                  text
                  :disabled="privilege != 3"
                  @click.stop="openEdit(index)"
                >编辑</el-button>
                <el-button
                  size="small"
                  type="danger"
                  text
                  :disabled="privilege < 3"
                  @click.stop="handleDelete(index)"
                >删除</el-button>
              </div>
              <span class="card-hint" @click="openDetail(index)">点击查看详情 →</span>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrap" v-if="total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="pageSizeOptions"
            :total="total"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </template>
    </div>

    <!-- 关键词管理弹窗 -->
    <el-dialog
      v-model="showKeywordModal"
      title="管理关键词"
      width="500px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="modal-section">
        <p class="modal-section-title">已添加关键词</p>
        <div class="modal-kw-tags" v-if="tempKeywords.length > 0">
          <span v-for="(kw, i) in tempKeywords" :key="i" class="kw-tag">
            {{ kw }}
            <span class="kw-tag-close" @click="removeTempKeyword(i)">×</span>
          </span>
        </div>
        <p v-else class="no-kw-tip">暂无关键词</p>
      </div>
      <div class="modal-section">
        <p class="modal-section-title">添加关键词</p>
        <div v-for="(inp, i) in keywordInputs" :key="i" class="kw-input-row">
          <el-input v-model="keywordInputs[i]" placeholder="输入关键词" />
          <el-button :icon="Close" circle text @click="removeKeywordInput(i)" />
        </div>
        <el-button class="add-row-btn" text :icon="Plus" @click="addKeywordInput">添加一行</el-button>
      </div>
      <template #footer>
        <el-button @click="cancelKeywordModal">取消</el-button>
        <el-button type="primary" @click="confirmKeywords">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="showDetailModal"
      width="700px"
      :close-on-click-modal="false"
      append-to-body
      class="detail-dialog"
    >
      <template #header>
        <div class="detail-header">
          <div class="detail-header-main">
            <h2 class="detail-title">{{ currentDetail.name }}</h2>
            <span class="detail-date">
              <svg class="detail-date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              创建于 {{ currentDetail.createTimeStr }}
            </span>
          </div>
        </div>
      </template>
      <div class="detail-body">
          <!-- 图文/流程模式切换 Tab（仅该记录绑定了流程时显示） -->
          <div class="detail-tabs" v-if="currentDetail.flowUrl">
            <button
              class="detail-tab"
              :class="{ active: detailTab === 'text' }"
              @click="detailTab = 'text'"
            >
              <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              图文模式
            </button>
            <button
              class="detail-tab"
              :class="{ active: detailTab === 'flow' }"
              @click="switchToFlowMode"
            >
              <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              流程模式
            </button>
          </div>

          <!-- 图文模式 -->
          <template v-if="!currentDetail.flowUrl || detailTab === 'text'">
            <div class="detail-block">
              <div class="detail-block-title">
                <span class="title-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>
                故障现象
              </div>
              <p class="detail-text">{{ currentDetail.phenomenon }}</p>
            </div>
            <div class="detail-block">
              <div class="detail-block-title">
                <span class="title-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></span>
                排查步骤
              </div>
              <div class="steps-list">
                <div v-for="(step, i) in currentDetail.shootingSteps" :key="i" class="step-item">
                  <span class="step-badge">{{ i + 1 }}</span>
                  <span class="step-text">{{ step }}</span>
                </div>
              </div>
            </div>
            <div class="detail-block" v-if="currentDetail.photoList && currentDetail.photoList.length > 0">
              <div class="detail-block-title">
                <span class="title-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></span>
                图片附件
                <span class="detail-count">{{ currentDetail.photoList.length }} 张</span>
              </div>
              <div class="detail-photo-list">
                <div
                  v-for="(url, i) in currentDetail.photoList"
                  :key="i"
                  class="detail-photo-item"
                >
                  <el-image
                    :src="url"
                    :preview-src-list="currentDetail.photoList"
                    :initial-index="i"
                    fit="cover"
                    class="detail-photo-img"
                    :alt="`照片 ${i + 1}`"
                  />
                  <div class="photo-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                    </svg>
                  </div>
                  <span class="detail-photo-label">照片 {{ i + 1 }}</span>
                </div>
              </div>
            </div>
            <div class="detail-block" v-if="currentDetail.docList && currentDetail.docList.length > 0">
              <div class="detail-block-title">
                <span class="title-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></span>
                文档附件
                <span class="detail-count">{{ currentDetail.docList.length }} 个</span>
              </div>
              <div class="attach-list">
                <a
                  v-for="(url, i) in currentDetail.docList"
                  :key="i"
                  :href="url"
                  referrerpolicy="origin"
                  target="_blank"
                  class="attach-item"
                >
                  <span class="attach-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </span>
                  <span class="attach-name">文件 {{ i + 1 }}</span>
                  <span class="attach-action">打开</span>
                </a>
              </div>
            </div>
          </template>

          <!-- 流程模式：加载 flowUrl 并用 FlowRunner 播放 -->
          <div v-else class="flow-mode-wrap">
            <div v-if="flowLoading" class="flow-state-box">
              <div class="spinner"></div>
              <p class="state-text">正在加载流程...</p>
            </div>
            <div v-else-if="flowError" class="flow-state-box flow-state-error">
              <div class="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <p class="state-text">{{ flowError }}</p>
              <el-button type="primary" @click="loadDetailFlow">重新加载</el-button>
            </div>
            <div class="flow-runner-card" v-else-if="detailFlow">
              <FlowRunner :flow="detailFlow" />
            </div>
          </div>
      </div>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="showEditModal"
      width="700px"
      :close-on-click-modal="false"
      append-to-body
      class="edit-dialog"
    >
      <template #header>
        <div class="edit-header">
          <h2 class="edit-title">编辑排查记录</h2>
          <p class="edit-subtitle">{{ editForm.name }} | 创建时间：{{ editForm.createTimeStr }}</p>
        </div>
      </template>
      <div class="edit-block">
        <div class="edit-block-title"><span class="title-dot"></span>故障现象<span class="required-mark">*</span></div>
        <el-input
          v-model="editForm.phenomenon"
          type="textarea"
          :rows="3"
          placeholder="请描述故障现象"
          maxlength="500"
          show-word-limit
        />
      </div>
      <div class="edit-block">
        <div class="edit-block-title"><span class="title-dot"></span>排查步骤<span class="required-mark">*</span></div>
        <div class="edit-steps-container">
          <div v-for="(step, i) in editForm.steps" :key="i" class="edit-step-row">
            <span class="edit-step-badge">{{ i + 1 }}</span>
            <el-input
              v-model="editForm.steps[i]"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              :placeholder="`请输入第 ${i + 1} 步排查内容`"
            />
            <el-button
              v-if="editForm.steps.length > 1"
              :icon="Close"
              circle
              text
              @click="removeEditStep(i)"
            />
          </div>
          <el-button class="edit-add-step-btn" text :icon="Plus" @click="addEditStep">添加步骤</el-button>
        </div>
      </div>
      <div class="edit-block">
        <div class="edit-block-title"><span class="title-dot"></span>图片附件</div>
        <div class="edit-upload-list">
          <div v-for="(photo, i) in editForm.photoList" :key="i" class="edit-preview-item">
            <img :src="photo.preview" alt="照片" class="edit-preview-img" />
            <span class="edit-photo-label">照片{{ i + 1 }}</span>
            <div class="edit-upload-mask" v-if="photo.uploading">上传中...</div>
            <button class="edit-preview-delete" @click="removeEditPhoto(i)">×</button>
          </div>
          <label class="edit-upload-trigger" v-if="editForm.photoList.length < 9">
            <el-icon><Picture /></el-icon>
            <span class="edit-upload-text">添加照片</span>
            <input type="file" accept="image/*" multiple @change="chooseEditPhoto($event)" hidden />
          </label>
        </div>
      </div>
      <div class="edit-block">
        <div class="edit-block-title"><span class="title-dot"></span>文档附件</div>
        <div class="edit-file-list" v-if="editForm.fileList.length > 0">
          <div v-for="(file, i) in editForm.fileList" :key="i" class="edit-file-item">
            <span class="edit-file-icon">
              <el-icon v-if="file.uploading"><Loading /></el-icon>
              <el-icon v-else><Document /></el-icon>
            </span>
            <div class="edit-file-info">
              <span class="edit-file-name">{{ file.name }}</span>
              <span class="edit-file-size">{{ file.uploading ? '上传中...' : file.sizeText }}</span>
            </div>
            <el-button :icon="Close" circle text @click="removeEditFile(i)" />
          </div>
        </div>
        <label class="edit-upload-trigger edit-upload-trigger-file">
          <el-icon><Paperclip /></el-icon>
          <span class="edit-upload-text">添加文件</span>
          <input type="file" multiple @change="chooseEditFile($event)" hidden />
        </label>
      </div>
      <template #footer>
        <el-button @click="closeEdit">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="showDeleteConfirm"
      width="400px"
      :close-on-click-modal="false"
      append-to-body
      class="confirm-dialog"
    >
      <div class="confirm-content">
        <el-icon class="confirm-icon"><WarningFilled /></el-icon>
        <p class="confirm-msg">确定要删除该排查记录吗？删除后不可恢复。</p>
      </div>
      <template #footer>
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'
import { getUsername, getPrivilege } from '@/utils/token'
import { deleteFiles } from '@/utils/file'
import { uploadFile } from '@/utils/uploadQueue'
import { parseFlow } from '@/utils/flowSchema'
import FlowRunner from './flow/FlowRunner.vue'
import { ElMessage } from 'element-plus'
import { markRaw } from 'vue'
import { Search, Plus, Close, Picture, Document, Paperclip, Loading, WarningFilled } from '@element-plus/icons-vue'

export default {
  name: 'RetrievalPage',
  components: { FlowRunner },
  data() {
    return {
      // 图标组件引用（markRaw 避免组件被响应式化）
      Search: markRaw(Search), Plus: markRaw(Plus), Close: markRaw(Close),
      Picture: markRaw(Picture), Document: markRaw(Document), Paperclip: markRaw(Paperclip),
      Loading: markRaw(Loading), WarningFilled: markRaw(WarningFilled),
      shipList: [],
      selectedShipId: '',
      selectedShipName: '',
      keywords: [],
      showKeywordModal: false,
      tempKeywords: [],
      keywordInputs: [''],
      resultList: [],
      currentPage: 1,
      pageSize: 5,
      pageSizeOptions: [5, 10, 20, 50],
      total: 0,
      totalPages: 0,
      isLoading: false,
      hasSearched: false,
      showDetailModal: false,
      currentDetail: null,
      // 详情弹窗模式：text 图文 / flow 流程（仅 flowUrl 非空时可切换）
      detailTab: 'text',
      flowLoading: false,
      flowError: '',
      detailFlow: null,
      showEditModal: false,
      editForm: {
        id: '',
        shipId: '',
        name: '',
        createTimeStr: '',
        phenomenon: '',
        steps: [''],
        photoList: [],
        fileList: []
      },
      privilege: 1,
      showDeleteConfirm: false,
      deleteIndex: -1,
      editDeletedFiles: []
    }
  },
  created() {
    this.privilege = getPrivilege()
    this.fetchShips()
  },
  methods: {
    // ====== 船型 ======
    fetchShips() {
      request.get('/ships').then(res => {
        if (res.data.code === 1 && res.data.data) {
          this.shipList = res.data.data.map(item => ({
            shipId: item.id,
            name: item.name
          }))
        }
      }).catch(() => {
        ElMessage.error('获取船型列表失败！')
      })
    },
    /** el-select change：根据 id 同步船型名（保留 selectedShipName 用于查询/提交） */
    onShipChange(val) {
      if (!val) {
        this.selectedShipName = ''
        return
      }
      const item = this.shipList.find(s => s.shipId === val)
      this.selectedShipName = item ? item.name : ''
    },

    // ====== 关键词 ======
    openKeywordModal() {
      this.showKeywordModal = true
      this.tempKeywords = this.keywords.slice()
      this.keywordInputs = ['']
    },
    cancelKeywordModal() {
      this.showKeywordModal = false
      this.tempKeywords = []
      this.keywordInputs = ['']
    },
    removeTempKeyword(index) {
      this.tempKeywords.splice(index, 1)
    },
    removeKeyword(index) {
      this.keywords.splice(index, 1)
    },
    addKeywordInput() {
      this.keywordInputs.push('')
    },
    removeKeywordInput(index) {
      this.keywordInputs.splice(index, 1)
    },
    confirmKeywords() {
      const kws = this.tempKeywords.slice()
      this.keywordInputs.forEach(val => {
        const v = val.trim()
        if (v && kws.indexOf(v) === -1) kws.push(v)
      })
      this.keywords = kws
      this.showKeywordModal = false
      this.tempKeywords = []
      this.keywordInputs = ['']
    },

    // ====== 检索 ======
    handleSearch() {
      if (!this.selectedShipId) {
        ElMessage({
          message: '请选择船型！',
          type: 'warning',
        })
        return
      }
      this.currentPage = 1
      this.fetchData()
    },
    fetchData() {
      this.isLoading = true
      this.hasSearched = true
      const params = {
        shipId: this.selectedShipId,
        page: this.currentPage,
        pageSize: this.pageSize
      }
      if (this.keywords.length > 0) {
        params.keyWord = this.keywords.join(',')
      }
      request.get('/trbsts', { params }).then(res => {
        const total = res.data.total || 0
        const rows = res.data.rows || []
        this.totalPages = Math.ceil(total / this.pageSize)
        rows.forEach(row => {
          row.photoList = Array.isArray(row.photo) ? row.photo : []
          row.docList = Array.isArray(row.doc) ? row.doc : []
          // 后端检索时同步返回的流程文件地址，非空时详情弹窗支持"流程模式"
          row.flowUrl = row.flowUrl || ''
          row.shootingPreview = this.getShootingPreview(row.shooting)
          row.createTimeStr = this.formatDate(row.createTime)
        })
        this.resultList = rows
        this.total = total
        this.isLoading = false
        if (total === 0) {
          ElMessage({
          message: '未检索到数据！',
          type: 'primary',
        })
        }
      }).catch(() => {
        this.isLoading = false
        this.resultList = []
        this.total = 0
        this.totalPages = 0
        ElMessage({
          message: '检索失败！',
          type: 'error',
        })
      })
    },
    getShootingPreview(shooting) {
      if (!shooting) return ''
      const steps = shooting.split(/[；;]/)
      if (steps.length > 2) return steps[0].trim() + '；' + steps[1].trim() + '...'
      return shooting
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const y = d.getFullYear()
      const m = ('0' + (d.getMonth() + 1)).slice(-2)
      const day = ('0' + d.getDate()).slice(-2)
      const h = ('0' + d.getHours()).slice(-2)
      const min = ('0' + d.getMinutes()).slice(-2)
      return `${y}-${m}-${day} ${h}:${min}`
    },

    // ====== 分页（el-pagination） ======
    onPageChange() {
      this.fetchData()
    },
    onSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.fetchData()
    },

    // ====== 详情 ======
    openDetail(index) {
      const item = this.resultList[index]
      const steps = []
      if (item.shooting) {
        item.shooting.split(/[；;]/).forEach(s => {
          const t = s.trim()
          if (t) steps.push(t)
        })
      }
      this.currentDetail = { ...item, shootingSteps: steps }
      // 每次打开默认图文模式，并重置流程状态（流程按需懒加载）
      this.detailTab = 'text'
      this.detailFlow = null
      this.flowLoading = false
      this.flowError = ''
      this.showDetailModal = true
    },
    closeDetail() {
      this.showDetailModal = false
      this.currentDetail = null
      this.detailTab = 'text'
      this.detailFlow = null
      this.flowLoading = false
      this.flowError = ''
    },
    /** 切换到流程模式：首次进入时懒加载流程文件 */
    switchToFlowMode() {
      this.detailTab = 'flow'
      if (!this.detailFlow && !this.flowLoading && !this.flowError) {
        this.loadDetailFlow()
      }
    },
    /** 下载并解析当前记录的流程文件 */
    async loadDetailFlow() {
      if (!this.currentDetail || !this.currentDetail.flowUrl) return
      this.flowLoading = true
      this.flowError = ''
      try {
        const res = await fetch(this.currentDetail.flowUrl, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        const { flow, errors } = parseFlow(text)
        if (!flow) {
          this.flowError = errors[0] || '流程文件解析失败'
          return
        }
        this.detailFlow = flow
        if (errors.length > 0) {
          ElMessage({ message: `流程已加载，${errors.length} 处自动修正`, type: 'warning' })
        }
      } catch (e) {
        this.flowError = '流程文件加载失败，请检查网络后重试'
      } finally {
        this.flowLoading = false
      }
    },

    // ====== 编辑 ======
    openEdit(index) {
      if (this.privilege != 3) {
        ElMessage({
          message: '权限不足，无法编辑！',
          type: 'warning',
        })
        return
      }
      const item = this.resultList[index]
      if (!item) return
      let steps = ['']
      if (item.shooting) {
        const parts = item.shooting.split(/[；;]/).map(s => s.trim()).filter(s => s)
        if (parts.length > 0) steps = parts
      }
      const photoList = (item.photoList || []).map(url => ({ preview: url, url, uploading: false }))
      const fileList = (item.docList || []).map((url, k) => ({ name: '文件' + (k + 1), sizeText: '', url, uploading: false }))
      this.editForm = {
        id: item.id,
        shipId: item.shipId,
        name: item.name,
        createTimeStr: item.createTimeStr,
        phenomenon: item.phenomenon || '',
        steps,
        photoList,
        fileList
      }
      this.editDeletedFiles = []
      this.showEditModal = true
    },
    closeEdit() {
      this.showEditModal = false
    },
    addEditStep() {
      this.editForm.steps.push('')
    },
    removeEditStep(index) {
      this.editForm.steps.splice(index, 1)
    },
    removeEditPhoto(index) {
      const photo = this.editForm.photoList[index]
      if (photo && photo.url) {
        this.editDeletedFiles.push(photo.url)
      }
      this.editForm.photoList.splice(index, 1)
    },
    removeEditFile(index) {
      const file = this.editForm.fileList[index]
      if (file && file.url) {
        this.editDeletedFiles.push(file.url)
      }
      this.editForm.fileList.splice(index, 1)
    },

    // ====== 文件上传 ======
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    // ====== 文件上传（节流逻辑由 @/utils/uploadQueue 统一管理） ======
    chooseEditPhoto(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (this.editForm.photoList.length + files.length > 9) {
        ElMessage({
          message: '最多上传9张照片！',
          type: 'warning',
        })
        return
      }
      const maxSize = 2 * 1024 * 1024
      for (const f of files) {
        if (f.size > maxSize) {
          ElMessage({
          message: '单张照片大小不能超过2MB！',
          type: 'warning',
        })
          return
        }
      }
      files.forEach((file, idx) => {
        const preview = URL.createObjectURL(file)
        const baseLen = this.editForm.photoList.length
        this.editForm.photoList.push({ preview, url: '', uploading: true })
        uploadFile(file).then(ossUrl => {
          this.editForm.photoList[baseLen].url = ossUrl
          this.editForm.photoList[baseLen].uploading = false
        }).catch(() => {
          ElMessage({
          message: '文件上传失败！',
          type: 'error',
        })
          this.editForm.photoList.splice(baseLen, 1)
        })
      })
    },
    chooseEditFile(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      const maxSize = 2 * 1024 * 1024
      for (const f of files) {
        if (f.size > maxSize) {
          ElMessage({
          message: '单个文件大小不能超过2MB！',
          type: 'warning',
        })
          return
        }
      }
      files.forEach(file => {
        const baseLen = this.editForm.fileList.length
        this.editForm.fileList.push({
          name: file.name,
          sizeText: this.formatFileSize(file.size),
          url: '',
          uploading: true
        })
        uploadFile(file).then(ossUrl => {
          this.editForm.fileList[baseLen].url = ossUrl
          this.editForm.fileList[baseLen].uploading = false
        }).catch(() => {
          ElMessage({
          message: '文件上传失败！',
          type: 'error',
        })
          this.editForm.fileList.splice(baseLen, 1)
        })
      })
    },

    // ====== 保存编辑 ======
    joinEditSteps() {
      return this.editForm.steps.map(s => s.trim()).filter(s => s).join('；')
    },
    saveEdit() {
      if (!this.editForm.phenomenon.trim()) {
        ElMessage({
          message: '请输入故障现象！',
          type: 'warning',
        })
        return
      }
      const shootingStr = this.joinEditSteps()
      if (!shootingStr) {
        ElMessage({
          message: '请输入至少一条排查步骤！',
          type: 'warning',
        })
        return
      }
      for (const p of this.editForm.photoList) {
        if (p.uploading) { ElMessage({
          message: '照片上传中，请稍候！',
          type: 'warning',
        }); return }
      }
      for (const f of this.editForm.fileList) {
        if (f.uploading) { ElMessage({
          message: '文件上传中，请稍候！',
          type: 'warning',
        }); return }
      }
      const photoUrls = this.editForm.photoList.filter(p => p.url).map(p => p.url)
      const docUrls = this.editForm.fileList.filter(f => f.url).map(f => f.url)
      const submitData = {
        id: this.editForm.id,
        phenomenon: this.editForm.phenomenon.trim(),
        shooting: shootingStr,
        photo: photoUrls,
        doc: docUrls
      }
      request.post('/trbsts', submitData).then(res => {
        if (res.data.code === 1) {
          // 提交编辑期间被删除的源文件到后端清理
          if (this.editDeletedFiles.length > 0) {
            deleteFiles(this.editDeletedFiles)
            this.editDeletedFiles = []
          }
          ElMessage({
          message: '保存成功！',
          type: 'success',
        })
          this.showEditModal = false
          this.fetchData()
        } else {
          ElMessage({
          message: res.data.msg || '保存失败！',
          type: 'error',
        })
        }
      }).catch(() => {
        ElMessage({
          message: '保存失败！',
          type: 'error',
        })
      })
    },

    // ====== 删除 ======
    handleDelete(index) {
      if (this.privilege < 3) {
        ElMessage({
          message: '权限不足，无法删除！',
          type: 'warning',
        })
        return
      }
      this.deleteIndex = index
      this.showDeleteConfirm = true
    },
    confirmDelete() {
      this.showDeleteConfirm = false
      const item = this.resultList[this.deleteIndex]
      if (!item || !item.id) {
        ElMessage({
          message: '无法获取记录ID！',
          type: 'warning',
        })
        return
      }
      request.delete('/trbsts', { params: { id: item.id } }).then(res => {
        if (res.data.code === 1) {
          ElMessage({
            message: '删除成功！',
            type: 'success',
          })
          // 删除该记录关联的所有源文件（图片、文档、绑定的流程 JSON）
          const urls = [
            ...(item.photoList || []),
            ...(item.docList || [])
          ]
          if (item.flowUrl) urls.push(item.flowUrl)
          if (urls.length > 0) deleteFiles(urls)
          this.fetchData()
        } else {
          ElMessage({
          message: res.data.msg || '删除失败！',
          type: 'error',
        })
        }
      }).catch(() => {
        ElMessage({
          message: '删除失败！',
          type: 'error',
        })
      })
    }
  }
}
</script>

<style scoped>
.retrieval-page {
  max-width: 1000px;
  margin: 0 auto;
}

/* 搜索卡片 */
.search-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.search-row {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.field-group {
  flex: 1;
  min-width: 200px;
}

.field-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

/* 船型选择器（el-select） */
.ship-select {
  width: 100%;
}

/* 关键词 */
.keyword-group {
  flex: 1.5;
}

.keyword-content {
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 6px 14px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fafbfc;
  cursor: pointer;
  gap: 8px;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.kw-tag {
  display: inline-flex;
  align-items: center;
  background: #e8f4ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  color: #1E90FF;
  gap: 4px;
}

.kw-tag-close {
  cursor: pointer;
  color: #999;
  font-size: 14px;
}

.kw-tag-close:hover {
  color: #ed4014;
}

.keyword-placeholder {
  flex: 1;
  font-size: 14px;
  color: #999;
}

.keyword-add-icon {
  font-size: 16px;
  color: var(--oc-primary, #3584e4);
}

/* 搜索按钮（el-button） */
.search-btn-wrap {
  flex-shrink: 0;
}

/* 结果区域 */
.result-section {
  margin-top: 20px;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

.state-text {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e4e8;
  border-top-color: #1E90FF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-stat {
  padding: 8px 4px;
  font-size: 13px;
  color: #666;
}

/* 结果卡片 */
.result-list {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.result-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.result-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.card-date {
  font-size: 12px;
  color: #999;
}

.card-body {
  flex: 1;
  margin-bottom: 12px;
  cursor: pointer;
}

.card-section {
  margin-bottom: 10px;
}

.card-section:last-child {
  margin-bottom: 0;
}

.card-label {
  font-size: 12px;
  color: #1E90FF;
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}

.card-phenomenon {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-shooting {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.card-btn {
  padding: 5px 14px;
  font-size: 12px;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background: #e8f4ff;
  border-color: #b3d8ff;
  color: #1E90FF;
}

.edit-btn:hover {
  background: #d0ebff;
}

.delete-btn {
  background: #fef0f0;
  border-color: #fbc4c4;
  color: #ed4014;
}

.delete-btn:hover {
  background: #fee0e0;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
}

.btn-disabled:hover {
  background: inherit !important;
}

.card-hint {
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.card-hint:hover {
  color: #1E90FF;
}

/* 分页 */
.pagination-wrap {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.page-size-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  gap: 8px;
}

.page-label {
  font-size: 13px;
  color: #666;
}

.size-options {
  display: flex;
  gap: 6px;
}

.size-option {
  min-width: 36px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #666;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  cursor: pointer;
  padding: 0 8px;
}

.size-option.active {
  color: #1E90FF;
  border-color: #1E90FF;
  background: #e8f4ff;
  font-weight: 500;
}

.page-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.page-btn {
  padding: 0 14px;
  height: 32px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-num {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #666;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  padding: 0 6px;
}

.page-num.active {
  color: #fff;
  background: #1E90FF;
  border-color: #1E90FF;
  font-weight: 500;
}

/* ====== 通用弹窗 ====== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 30, 60, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-dialog {
  background: #fff;
  border-radius: 12px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.keyword-modal {
  width: 500px;
  max-width: 90vw;
}

.detail-modal,
.edit-modal {
  width: 700px;
  max-width: 90vw;
}

.confirm-modal {
  width: 400px;
  max-width: 90vw;
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  color: #fff;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.edit-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--oc-title, #1a3a6e);
}

.detail-date,
.edit-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--oc-text-light, #8a94a6);
}

.modal-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

/* 关键词弹窗 */
.modal-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.modal-section:last-child {
  border-bottom: none;
}

.modal-section-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px;
}

.modal-kw-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.no-kw-tip {
  font-size: 13px;
  color: #999;
}

.kw-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}

.kw-modal-input {
  flex: 1;
  height: 36px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  background: #fafbfc;
  outline: none;
}

.kw-modal-input:focus {
  border-color: #3584e4;
}

.kw-input-delete {
  background: none;
  border: none;
  font-size: 18px;
  color: #ed4014;
  cursor: pointer;
  padding: 0 8px;
}

.add-row-btn {
  width: 100%;
  padding: 8px 0;
  font-size: 13px;
  color: #1E90FF;
  background: none;
  border: 1px dashed #1E90FF;
  border-radius: 6px;
  cursor: pointer;
}

.add-row-btn:hover {
  background: #f0f7ff;
}

/* ====== 详情弹窗（现代卡片式） ====== */
.detail-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 20px 48px 20px 24px;
  background: #fff;
  border-bottom: 1px solid #eef1f6;
  flex-shrink: 0;
}

.detail-header-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.detail-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a3a6e;
  line-height: 1.4;
}

.detail-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8a94a6;
  background: #f5f7fa;
  padding: 4px 10px;
  border-radius: 20px;
  width: fit-content;
}

.detail-date-icon {
  width: 13px;
  height: 13px;
}

.detail-body {
  padding: 24px;
  background: #f5f7fa;
}

.detail-tabs {
  display: inline-flex;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  background: #e8ecf0;
  border-radius: 10px;
}

.detail-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  color: #6b7a99;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.tab-icon {
  width: 14px;
  height: 14px;
}

.detail-tab:hover {
  color: #3584e4;
}

.detail-tab.active {
  color: #1a5fb4;
  background: #fff;
  box-shadow: 0 1px 3px rgba(26, 63, 110, 0.08);
}

.detail-block {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  border: 1px solid #eef1f6;
}

.detail-block:last-child {
  margin-bottom: 0;
}

.detail-block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #1a3a6e;
}

.title-icon {
  width: 18px;
  height: 18px;
  color: #3584e4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-icon svg {
  width: 100%;
  height: 100%;
}

.detail-count {
  margin-left: auto;
  font-size: 12px;
  color: #8a94a6;
  font-weight: 400;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.detail-text {
  font-size: 14px;
  color: #46587a;
  line-height: 1.8;
  margin: 0;
}

.steps-list {
  position: relative;
  padding-left: 18px;
}

.steps-list::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(180deg, #3584e4, rgba(53, 132, 228, 0.15));
  border-radius: 1px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
}

.step-item:last-child {
  margin-bottom: 0;
}

.step-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  color: #3584e4;
  border: 2px solid #3584e4;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 14px;
  margin-left: -18px;
  position: relative;
  z-index: 1;
}

.step-text {
  font-size: 14px;
  color: #46587a;
  line-height: 1.7;
  flex: 1;
  padding-top: 2px;
}

.detail-photo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.detail-photo-item {
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  cursor: zoom-in;
  background: #f5f7fa;
  border: 1px solid #eef1f6;
}

.detail-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.detail-photo-item:hover .detail-photo-img {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 58, 110, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s;
}

.photo-overlay svg {
  width: 22px;
  height: 22px;
  color: #fff;
}

.detail-photo-item:hover .photo-overlay {
  opacity: 1;
}

.detail-photo-label {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.95);
  color: #1a3a6e;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  padding: 3px 0;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.attach-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attach-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 10px;
  gap: 12px;
  text-decoration: none;
  font-size: 14px;
  background: #f8fafc;
  border: 1px solid #eef1f6;
  transition: all 0.2s;
}

.attach-item:hover {
  background: #f0f5ff;
  border-color: #c5d9f7;
}

.attach-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  color: #3584e4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.attach-icon svg {
  width: 18px;
  height: 18px;
}

.attach-name {
  flex: 1;
  color: #1a3a6e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attach-action {
  font-size: 12px;
  color: #3584e4;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #d6e4f7;
}

.attach-item:hover .attach-action {
  background: #3584e4;
  color: #fff;
  border-color: #3584e4;
}

.flow-mode-wrap {
  min-height: 240px;
}

.flow-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 48px 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef1f6;
}

.flow-state-error .state-text {
  color: #ed4014;
}

.error-icon {
  width: 44px;
  height: 44px;
  color: #ed4014;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fdf0ee;
  border-radius: 50%;
}

.error-icon svg {
  width: 22px;
  height: 22px;
}

.flow-runner-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #eef1f6;
}

/* 编辑弹窗 */
.edit-block {
  margin-bottom: 24px;
}

.edit-block:last-child {
  margin-bottom: 0;
}

.edit-block-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.required-mark {
  color: #ed4014;
  font-size: 15px;
  margin-left: 4px;
}

.edit-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 14px;
  background: #fafbfc;
  box-sizing: border-box;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.edit-textarea:focus {
  border-color: #3584e4;
}

.edit-steps-container {
  width: 100%;
}

.edit-step-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 8px;
}

.edit-step-badge {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--oc-primary-bg, #f0f5ff);
  color: var(--oc-primary-dark, #1a5fb4);
  border: 1.5px solid var(--oc-primary, #3584e4);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px;
}

.edit-step-textarea {
  flex: 1;
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 14px;
  background: #fafbfc;
  box-sizing: border-box;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.edit-step-textarea:focus {
  border-color: #3584e4;
}

.edit-step-delete {
  background: none;
  border: none;
  font-size: 18px;
  color: #ed4014;
  cursor: pointer;
  padding: 0 8px;
  margin-top: 4px;
}

.edit-add-step-btn {
  width: 100%;
  padding: 8px 0;
  font-size: 13px;
  color: #1E90FF;
  background: none;
  border: 1px dashed #1E90FF;
  border-radius: 6px;
  cursor: pointer;
}

.edit-add-step-btn:hover {
  background: #f0f7ff;
}

.edit-upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.edit-preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.edit-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-photo-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 10px;
  text-align: center;
  padding: 2px 0;
}

.edit-upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.edit-preview-delete {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-upload-trigger {
  width: 100px;
  height: 100px;
  border: 1px dashed #d0d5dd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafbfc;
  cursor: pointer;
  gap: 4px;
  font-size: 20px;
}

.edit-upload-trigger:hover {
  background: #f0f0f0;
}

.edit-upload-text {
  font-size: 12px;
  color: #999;
}

.edit-upload-trigger-file {
  width: 100%;
  height: 50px;
  flex-direction: row;
  margin-top: 12px;
  max-width: 100%;
}

.edit-file-list {
  width: 100%;
}

.edit-file-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #fafbfc;
  border: 1px solid #e8ecf0;
  border-radius: 8px;
  margin-bottom: 8px;
  gap: 10px;
}

.edit-file-item:last-child {
  margin-bottom: 0;
}

.edit-file-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.edit-file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.edit-file-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-file-size {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.edit-file-delete {
  background: none;
  border: none;
  font-size: 16px;
  color: #c0c4cc;
  cursor: pointer;
  padding: 0 8px;
}

.edit-file-delete:hover {
  color: #ed4014;
}

/* 通用按钮 */
.btn-cancel {
  padding: 8px 20px;
  font-size: 14px;
  color: #1a5fb4;
  background: #fff;
  border: 1px solid #3584e4;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f0f5ff;
}

.btn-submit {
  padding: 8px 20px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-submit:hover {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
}

.btn-delete {
  padding: 8px 20px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, #ed4014, #d03020);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-delete:hover {
  background: linear-gradient(135deg, #d03020, #b02818);
}

.confirm-msg {
  margin: 0 0 20px;
  font-size: 15px;
  color: #333;
  text-align: center;
  line-height: 1.6;
}

/* 提示弹框 */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 30, 60, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.alert-dialog {
  background: #fff;
  border-radius: 10px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.alert-msg {
  margin: 0;
  padding: 28px 24px;
  font-size: 15px;
  color: #1a3a6e;
  text-align: center;
  line-height: 1.6;
}

.alert-btn {
  display: block;
  width: 100%;
  padding: 12px 0;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  cursor: pointer;
}

.alert-btn:hover {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!-- 全局样式：弹窗固定高度 + 内容区滚动（append-to-body 导致 scoped 无法穿透） -->
<style>
/* 详情弹窗 */
.detail-dialog {
  height: 600px !important;
  display: flex;
  flex-direction: column;
}
.detail-dialog .el-dialog__body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 编辑弹窗 */
.edit-dialog {
  height: 600px !important;
  display: flex;
  flex-direction: column;
}
.edit-dialog .el-dialog__body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 20px 24px;
}
</style>