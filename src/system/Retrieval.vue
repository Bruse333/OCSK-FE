<template>
  <div class="retrieval-page">
    <!-- 搜索区域 -->
    <div class="search-card">
      <div class="search-row">
        <!-- 船型选择 -->
        <div class="field-group">
          <label class="field-label">船型</label>
          <div class="ship-selector" @click="toggleShipDropdown">
            <span class="selector-text" :class="{ selected: selectedShipName }">
              {{ selectedShipName || '请选择船型' }}
            </span>
            <span class="selector-arrow" :class="{ up: showShipDropdown }">&#9662;</span>
            <div class="ship-dropdown" v-if="showShipDropdown">
              <div
                v-for="item in shipList"
                :key="item.shipId"
                class="ship-option"
                :class="{ active: selectedShipId === item.shipId }"
                @click.stop="selectShip(item.shipId, item.name)"
              >
                {{ item.name }}
              </div>
            </div>
          </div>
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
            <span class="keyword-add-icon">+</span>
          </div>
        </div>

        <!-- 搜索按钮 -->
        <div class="search-btn-wrap">
          <button class="btn-search" @click="handleSearch">检索</button>
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
                <button
                  class="card-btn edit-btn"
                  :class="{ 'btn-disabled': privilege != 3 }"
                  :disabled="privilege != 3"
                  @click.stop="openEdit(index)"
                >编辑</button>
                <button
                  class="card-btn delete-btn"
                  :class="{ 'btn-disabled': privilege < 3 }"
                  :disabled="privilege < 3"
                  @click.stop="handleDelete(index)"
                >删除</button>
              </div>
              <span class="card-hint" @click="openDetail(index)">点击查看详情 →</span>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrap" v-if="total > 0">
          <div class="page-size-selector">
            <span class="page-label">每页</span>
            <div class="size-options">
              <span
                v-for="size in pageSizeOptions"
                :key="size"
                class="size-option"
                :class="{ active: pageSize === size }"
                @click="changePageSize(size)"
              >{{ size }}</span>
            </div>
            <span class="page-label">条</span>
          </div>
          <div class="page-nav">
            <button class="page-btn" :disabled="currentPage <= 1" @click="prevPage">上一页</button>
            <span
              v-for="p in totalPages"
              :key="p"
              class="page-num"
              :class="{ active: currentPage === p }"
              @click="changePage(p)"
            >{{ p }}</span>
            <button class="page-btn" :disabled="currentPage >= totalPages" @click="nextPage">下一页</button>
          </div>
        </div>
      </template>
    </div>

    <!-- 关键词管理弹窗 -->
    <div class="modal-overlay" v-if="showKeywordModal" @click.self="cancelKeywordModal">
      <div class="modal-dialog keyword-modal">
        <div class="modal-header">
          <h2>管理关键词</h2>
          <button class="modal-close" @click="cancelKeywordModal">×</button>
        </div>
        <div class="modal-body">
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
              <input
                v-model="keywordInputs[i]"
                class="kw-modal-input"
                placeholder="输入关键词"
              />
              <button class="kw-input-delete" @click="removeKeywordInput(i)">×</button>
            </div>
            <button class="add-row-btn" @click="addKeywordInput">+ 添加一行</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cancelKeywordModal">取消</button>
          <button class="btn-submit" @click="confirmKeywords">确定</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" v-if="showDetailModal" @click.self="closeDetail">
      <div class="modal-dialog detail-modal">
        <div class="modal-header">
          <div>
            <h2>{{ currentDetail.name }}</h2>
            <p class="detail-date">创建时间：{{ currentDetail.createTimeStr }}</p>
          </div>
          <button class="modal-close" @click="closeDetail">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-block">
            <div class="detail-block-title"><span class="title-dot"></span>故障现象</div>
            <p class="detail-text">{{ currentDetail.phenomenon }}</p>
          </div>
          <div class="detail-block">
            <div class="detail-block-title"><span class="title-dot"></span>排查步骤</div>
            <div class="steps-list">
              <div v-for="(step, i) in currentDetail.shootingSteps" :key="i" class="step-item">
                <span class="step-badge">{{ i + 1 }}</span>
                <span class="step-text">{{ step }}</span>
              </div>
            </div>
          </div>
          <div class="detail-block" v-if="currentDetail.photoList && currentDetail.photoList.length > 0">
            <div class="detail-block-title"><span class="title-dot"></span>图片附件</div>
            <div class="detail-photo-list">
              <a
                v-for="(url, i) in currentDetail.photoList"
                :key="i"
                :href="url"
                target="_blank"
                class="detail-photo-item"
              >
                <img :src="url" alt="照片" class="detail-photo-img" />
                <span class="detail-photo-label">照片{{ i + 1 }}</span>
              </a>
            </div>
          </div>
          <div class="detail-block" v-if="currentDetail.docList && currentDetail.docList.length > 0">
            <div class="detail-block-title"><span class="title-dot"></span>文档附件</div>
            <div class="attach-list">
              <a
                v-for="(url, i) in currentDetail.docList"
                :key="i"
                :href="url"
                referrerpolicy="origin"
                target="_blank"
                class="attach-item doc-item"
              >
                <span class="attach-icon">📄</span>
                <span class="attach-name">文件 {{ i + 1 }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div class="modal-overlay" v-if="showEditModal" @click.self="closeEdit">
      <div class="modal-dialog edit-modal">
        <div class="modal-header">
          <div>
            <h2>编辑排查记录</h2>
            <p class="edit-subtitle">{{ editForm.name }} | 创建时间：{{ editForm.createTimeStr }}</p>
          </div>
          <button class="modal-close" @click="closeEdit">×</button>
        </div>
        <div class="modal-body">
          <div class="edit-block">
            <div class="edit-block-title"><span class="title-dot"></span>故障现象<span class="required-mark">*</span></div>
            <textarea
              v-model="editForm.phenomenon"
              class="edit-textarea"
              placeholder="请描述故障现象"
              maxlength="500"
            ></textarea>
          </div>
          <div class="edit-block">
            <div class="edit-block-title"><span class="title-dot"></span>排查步骤<span class="required-mark">*</span></div>
            <div class="edit-steps-container">
              <div v-for="(step, i) in editForm.steps" :key="i" class="edit-step-row">
                <span class="edit-step-badge">{{ i + 1 }}</span>
                <textarea
                  v-model="editForm.steps[i]"
                  class="edit-step-textarea"
                  :placeholder="`请输入第 ${i + 1} 步排查内容`"
                ></textarea>
                <button v-if="editForm.steps.length > 1" class="edit-step-delete" @click="removeEditStep(i)">×</button>
              </div>
              <button class="edit-add-step-btn" @click="addEditStep">+ 添加步骤</button>
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
                <span>📷</span>
                <span class="edit-upload-text">添加照片</span>
                <input type="file" accept="image/*" multiple @change="chooseEditPhoto($event)" hidden />
              </label>
            </div>
          </div>
          <div class="edit-block">
            <div class="edit-block-title"><span class="title-dot"></span>文档附件</div>
            <div class="edit-file-list" v-if="editForm.fileList.length > 0">
              <div v-for="(file, i) in editForm.fileList" :key="i" class="edit-file-item">
                <span class="edit-file-icon">{{ file.uploading ? '⏳' : '📄' }}</span>
                <div class="edit-file-info">
                  <span class="edit-file-name">{{ file.name }}</span>
                  <span class="edit-file-size">{{ file.uploading ? '上传中...' : file.sizeText }}</span>
                </div>
                <button class="edit-file-delete" @click="removeEditFile(i)">×</button>
              </div>
            </div>
            <label class="edit-upload-trigger edit-upload-trigger-file">
              <span>📎</span>
              <span class="edit-upload-text">添加文件</span>
              <input type="file" multiple @change="chooseEditFile($event)" hidden />
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEdit">取消</button>
          <button class="btn-submit" @click="saveEdit">保存修改</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @click.self="showDeleteConfirm = false">
      <div class="modal-dialog confirm-modal">
        <p class="confirm-msg">确定要删除该排查记录吗？删除后不可恢复。</p>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-delete" @click="confirmDelete">确认删除</button>
        </div>
      </div>
    </div>

    <!-- 提示弹框 -->
    <transition name="fade">
      <div v-if="alertBox.show" class="alert-overlay" @click.self="closeAlert">
        <div class="alert-dialog">
          <p class="alert-msg">{{ alertBox.msg }}</p>
          <button class="alert-btn" @click="closeAlert">确定</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import request from '@/utils/request'
import { getUsername, getPrivilege } from '@/utils/token'
import { deleteFiles } from '@/utils/file'
import { uploadFile } from '@/utils/uploadQueue'
import { ElMessage } from 'element-plus'

export default {
  name: 'RetrievalPage',
  data() {
    return {
      shipList: [],
      selectedShipId: '',
      selectedShipName: '',
      showShipDropdown: false,
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
      editDeletedFiles: [],
      alertBox: { show: false, msg: '' }
    }
  },
  created() {
    this.privilege = getPrivilege()
    this.fetchShips()
  },
  methods: {
    showAlert(msg) {
      this.alertBox.msg = msg
      this.alertBox.show = true
    },
    closeAlert() {
      this.alertBox.show = false
    },

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
        ElMessage({
          message: '获取船型列表失败！',
          type: 'error',
        })
      })
    },
    toggleShipDropdown() {
      this.showShipDropdown = !this.showShipDropdown
    },
    selectShip(id, name) {
      this.selectedShipId = id
      this.selectedShipName = name
      this.showShipDropdown = false
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

    // ====== 分页 ======
    changePage(page) {
      if (page < 1 || page > this.totalPages) return
      this.currentPage = page
      this.fetchData()
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        this.fetchData()
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.fetchData()
      }
    },
    changePageSize(size) {
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
      this.showDetailModal = true
    },
    closeDetail() {
      this.showDetailModal = false
      this.currentDetail = null
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
          // 删除该记录关联的所有源文件
          const urls = [
            ...(item.photoList || []),
            ...(item.docList || [])
          ]
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

/* 船型选择器 */
.ship-selector {
  position: relative;
  height: 38px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fafbfc;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 14px;
}

.selector-text {
  font-size: 14px;
  color: #999;
  flex: 1;
}

.selector-text.selected {
  color: #333;
}

.selector-arrow {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}

.selector-arrow.up {
  transform: rotate(180deg);
}

.ship-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
}

.ship-option {
  padding: 10px 14px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.ship-option:last-child {
  border-bottom: none;
}

.ship-option:hover {
  background: #f0f7ff;
}

.ship-option.active {
  color: #1E90FF;
  background: #e8f4ff;
  font-weight: 500;
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
  font-size: 18px;
  color: #1E90FF;
  font-weight: 300;
}

/* 搜索按钮 */
.search-btn-wrap {
  flex-shrink: 0;
}

.btn-search {
  padding: 8px 32px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  height: 38px;
  transition: all 0.2s;
}

.btn-search:hover {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
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

.detail-date,
.edit-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.85;
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

/* 详情弹窗 */
.detail-block {
  margin-bottom: 24px;
}

.detail-block:last-child {
  margin-bottom: 0;
}

.detail-block-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.title-dot {
  width: 4px;
  height: 16px;
  background: #1E90FF;
  border-radius: 2px;
  margin-right: 10px;
  flex-shrink: 0;
}

.detail-text {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin: 0;
  padding-left: 14px;
}

.steps-list {
  padding-left: 14px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.step-item:last-child {
  margin-bottom: 0;
}

.step-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1E90FF, #1565c0);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 10px;
  margin-top: 2px;
}

.step-text {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  flex: 1;
}

.detail-photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-left: 14px;
}

.detail-photo-item {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  display: block;
  text-decoration: none;
}

.detail-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-photo-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 11px;
  text-align: center;
  padding: 2px 0;
}

.attach-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-left: 14px;
}

.attach-item {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 8px;
  gap: 8px;
  text-decoration: none;
  font-size: 13px;
}

.doc-item {
  background: #fff7e6;
  border: 1px solid #ffd591;
  color: #333;
}

.attach-icon {
  font-size: 16px;
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
  background: linear-gradient(135deg, #1E90FF, #1565c0);
  color: #fff;
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