<template>
  <div class="h5-retrieval-page">
    <!-- 搜索栏 -->
    <div class="h5-search-card">
      <div class="h5-search-row">
        <div class="h5-ship-select" @click="showShipPicker = true">
          <span class="h5-select-label">船型</span>
          <span class="h5-select-value" :class="{ placeholder: !selectedShipName }">
            {{ selectedShipName || '请选择' }}
          </span>
          <span class="h5-select-arrow">&#9654;</span>
        </div>
      </div>
      <div class="h5-search-row">
        <div class="h5-keyword-input" @click="showKeywordModal = true">
          <span v-if="keywords.length === 0" class="h5-keyword-placeholder">点击添加关键词</span>
          <div v-else class="h5-keyword-tags">
            <span v-for="(kw, i) in keywords" :key="i" class="h5-kw-tag">{{ kw }}</span>
            <span v-if="keywords.length > 2" class="h5-kw-more">+{{ keywords.length - 2 }}</span>
          </div>
        </div>
      </div>
      <button class="h5-search-btn" @click="handleSearch">检索</button>
    </div>

    <!-- 结果统计 -->
    <div class="h5-result-stat" v-if="hasSearched">
      共 {{ total }} 条结果
    </div>

    <!-- 结果列表 -->
    <div class="h5-result-list" v-if="resultList.length > 0">
      <div
        v-for="(item, index) in resultList"
        :key="item.id"
        class="h5-result-card"
        @click="openDetail(index)"
      >
        <div class="h5-card-header">
          <span class="h5-card-name">{{ item.name }}</span>
          <span class="h5-card-date">{{ item.createTimeStr }}</span>
        </div>
        <div class="h5-card-body">
          <div class="h5-card-line">
            <span class="h5-card-label">故障现象</span>
            <span class="h5-card-text">{{ item.phenomenon }}</span>
          </div>
          <div class="h5-card-line">
            <span class="h5-card-label">排查步骤</span>
            <span class="h5-card-text">{{ item.shootingPreview }}</span>
          </div>
        </div>
        <div class="h5-card-footer" @click.stop>
          <button
            class="h5-card-btn h5-edit-btn"
            :class="{ disabled: privilege != 3 }"
            :disabled="privilege != 3"
            @click="openEdit(index)"
          >编辑</button>
          <button
            class="h5-card-btn h5-delete-btn"
            :class="{ disabled: privilege < 3 }"
            :disabled="privilege < 3"
            @click="handleDelete(index)"
          >删除</button>
        </div>
      </div>

      <!-- 分页 -->
      <div class="h5-pagination" v-if="hasSearched && resultList.length > 0">
        <button
          class="h5-page-btn"
          :disabled="currentPage <= 1"
          @click="prevPage"
        >上一页</button>
        <span class="h5-page-info">{{ currentPage }} / {{ totalPages > 0 ? totalPages : 1 }}</span>
        <button
          class="h5-page-btn"
          :disabled="currentPage >= totalPages || totalPages === 0"
          @click="nextPage"
        >下一页</button>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="h5-empty-state" v-if="hasSearched && resultList.length === 0 && !isLoading">
      <p>暂无检索结果</p>
    </div>

    <!-- 加载状态 -->
    <div class="h5-loading-state" v-if="isLoading">
      <div class="h5-spinner"></div>
      <p>正在检索...</p>
    </div>

    <!-- 船型选择器弹窗（底部弹出式） -->
    <div class="h5-modal-overlay" v-if="showShipPicker" @click.self="showShipPicker = false">
      <div class="h5-picker-dialog">
        <div class="h5-picker-header">
          <span>选择船型</span>
          <button class="h5-picker-close" @click="showShipPicker = false">×</button>
        </div>
        <div class="h5-picker-body">
          <div
            v-for="item in shipList"
            :key="item.shipId"
            class="h5-picker-item"
            :class="{ active: selectedShipId === item.shipId }"
            @click="selectShip(item.shipId, item.name)"
          >
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 关键词弹窗 -->
    <div class="h5-modal-overlay" v-if="showKeywordModal" @click.self="showKeywordModal = false">
      <div class="h5-dialog">
        <div class="h5-dialog-header">
          <h3>关键词</h3>
          <button class="h5-dialog-close" @click="showKeywordModal = false">×</button>
        </div>
        <div class="h5-dialog-body">
          <div class="h5-kw-list" v-if="keywords.length > 0">
            <span v-for="(kw, i) in keywords" :key="i" class="h5-kw-tag">
              {{ kw }}
              <span class="h5-kw-close" @click="removeKeyword(i)">×</span>
            </span>
          </div>
          <p v-else class="h5-no-kw">暂无关键词</p>
          <div class="h5-kw-input-row">
            <input v-model="newKeyword" class="h5-kw-input" placeholder="输入关键词" maxlength="20" />
            <button class="h5-kw-add-btn" @click="addKeyword">添加</button>
          </div>
        </div>
        <div class="h5-dialog-footer">
          <button class="h5-dialog-btn" @click="showKeywordModal = false">确定</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗（卡片化，与 PC 端视觉一致） -->
    <div class="h5-modal-overlay" v-if="showDetailModal" @click.self="closeDetail">
      <div class="h5-dialog h5-detail-dialog">
        <div class="h5-dialog-header">
          <div class="h5-detail-header-main">
            <h3>{{ currentDetail.name }}</h3>
            <span class="h5-detail-time">创建于 {{ currentDetail.createTimeStr }}</span>
          </div>
          <button class="h5-dialog-close" @click="closeDetail">×</button>
        </div>
        <div class="h5-dialog-body">
          <!-- 图文/流程模式切换 Tab -->
          <div class="h5-detail-tabs" v-if="currentDetail.flowUrl">
            <button
              class="h5-detail-tab"
              :class="{ active: detailTab === 'text' }"
              @click="detailTab = 'text'"
            >图文</button>
            <button
              class="h5-detail-tab"
              :class="{ active: detailTab === 'flow' }"
              @click="switchToFlowMode"
            >流程</button>
          </div>

          <!-- 图文模式 -->
          <template v-if="!currentDetail.flowUrl || detailTab === 'text'">
            <div class="h5-detail-block">
              <div class="h5-detail-title">故障现象</div>
              <p class="h5-detail-text">{{ currentDetail.phenomenon }}</p>
            </div>
            <div class="h5-detail-block">
              <div class="h5-detail-title">排查步骤</div>
              <div class="h5-steps">
                <div v-for="(step, i) in currentDetail.shootingSteps" :key="i" class="h5-step">
                  <span class="h5-step-index">{{ i + 1 }}</span>
                  <span class="h5-step-text">{{ step }}</span>
                </div>
              </div>
            </div>
            <div class="h5-detail-block" v-if="currentDetail.photoList && currentDetail.photoList.length > 0">
              <div class="h5-detail-title">图片附件 <span class="h5-detail-count">{{ currentDetail.photoList.length }} 张</span></div>
              <div class="h5-photos">
                <el-image
                  v-for="(url, i) in currentDetail.photoList"
                  :key="i"
                  :src="url"
                  :preview-src-list="currentDetail.photoList"
                  :initial-index="i"
                  fit="cover"
                  class="h5-photo-item"
                  :alt="`照片 ${i + 1}`"
                />
              </div>
            </div>
            <div class="h5-detail-block" v-if="currentDetail.docList && currentDetail.docList.length > 0">
              <div class="h5-detail-title">文档附件 <span class="h5-detail-count">{{ currentDetail.docList.length }} 个</span></div>
              <div class="h5-docs">
                <a
                  v-for="(url, i) in currentDetail.docList"
                  :key="i"
                  :href="url"
                  target="_blank"
                  class="h5-doc-card"
                >
                  <span class="h5-doc-icon">📄</span>
                  <span class="h5-doc-name">文件 {{ i + 1 }}</span>
                </a>
              </div>
            </div>
          </template>

          <!-- 流程模式 -->
          <div v-else class="h5-flow-wrap">
            <div v-if="flowLoading" class="h5-loading-state">
              <div class="h5-spinner"></div>
              <p>正在加载流程...</p>
            </div>
            <div v-else-if="flowError" class="h5-loading-state">
              <p>{{ flowError }}</p>
              <button class="h5-btn-primary" @click="loadDetailFlow">重试</button>
            </div>
            <FlowRunner v-else-if="detailFlow" :flow="detailFlow" />
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div class="h5-modal-overlay" v-if="showEditModal" @click.self="closeEdit">
      <div class="h5-dialog h5-edit-dialog">
        <div class="h5-dialog-header">
          <h3>编辑排查记录</h3>
          <button class="h5-dialog-close" @click="closeEdit">×</button>
        </div>
        <div class="h5-dialog-body">
          <div class="h5-form-group">
            <label>故障现象 <span class="h5-required">*</span></label>
            <textarea v-model="editForm.phenomenon" class="h5-textarea" placeholder="请输入故障现象"></textarea>
          </div>
          <div class="h5-form-group">
            <label>排查步骤 <span class="h5-required">*</span></label>
            <div class="h5-edit-steps">
              <div v-for="(step, i) in editForm.steps" :key="i" class="h5-edit-step-row">
                <span class="h5-step-index">{{ i + 1 }}</span>
                <input v-model="editForm.steps[i]" class="h5-step-input" :placeholder="`第${i + 1}步`" />
                <button v-if="editForm.steps.length > 1" class="h5-step-del" @click="removeEditStep(i)">×</button>
              </div>
              <button class="h5-add-step-btn" @click="addEditStep">+ 添加步骤</button>
            </div>
          </div>
          <div class="h5-form-group">
            <label>照片附件</label>
            <div class="h5-upload-list">
              <div v-for="(photo, i) in editForm.photoList" :key="i" class="h5-upload-item">
                <img :src="photo.preview" alt="照片" />
                <div class="h5-upload-mask" v-if="photo.uploading">上传中</div>
                <button class="h5-upload-del" @click="removeEditPhoto(i)">×</button>
              </div>
              <label class="h5-upload-add" v-if="editForm.photoList.length < 9">
                <span>+ 照片</span>
                <input type="file" accept="image/*" multiple @change="chooseEditPhoto($event)" hidden />
              </label>
            </div>
          </div>
          <div class="h5-form-group">
            <label>文档附件</label>
            <div class="h5-file-list" v-if="editForm.fileList.length > 0">
              <div v-for="(file, i) in editForm.fileList" :key="i" class="h5-file-item">
                <span>{{ file.uploading ? '⏳' : '📄' }} 文件 {{ i + 1 }}</span>
                <button class="h5-upload-del" @click="removeEditFile(i)">×</button>
              </div>
            </div>
            <label class="h5-upload-add h5-upload-add-file">
              <span>+ 文件</span>
              <input type="file" multiple @change="chooseEditFile($event)" hidden />
            </label>
          </div>
        </div>
        <div class="h5-dialog-footer">
          <button class="h5-btn-cancel" @click="closeEdit">取消</button>
          <button class="h5-btn-submit" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { getUsername, getPrivilege } from '@/utils/token'
import { deleteFiles } from '@/utils/file'
import { uploadFile } from '@/utils/uploadQueue'
import { parseFlow } from '@/utils/flowSchema'
import FlowRunner from './flow/FlowRunner.vue'

export default {
  name: 'RetrievalPageH5',
  components: { FlowRunner },
  data() {
    return {
      shipList: [],
      selectedShipId: '',
      selectedShipName: '',
      showShipPicker: false,
      keywords: [],
      showKeywordModal: false,
      newKeyword: '',
      resultList: [],
      currentPage: 1,
      pageSize: 5,
      total: 0,
      totalPages: 0,
      isLoading: false,
      hasSearched: false,
      showDetailModal: false,
      currentDetail: null,
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
      deleteIndex: -1,
      editDeletedFiles: []
    }
  },
  created() {
    this.privilege = getPrivilege()
    this.fetchShips()
  },
  methods: {
    fetchShips() {
      request.get('/ships').then(res => {
        if (res.data.code === 1 && res.data.data) {
          this.shipList = res.data.data.map(item => ({ shipId: item.id, name: item.name }))
        }
      }).catch(() => {
        ElMessage({ message: '获取船型列表失败！', type: 'error' })
      })
    },
    selectShip(id, name) {
      this.selectedShipId = id
      this.selectedShipName = name
      this.showShipPicker = false
    },

    addKeyword() {
      const v = this.newKeyword.trim()
      if (!v) return
      if (this.keywords.indexOf(v) === -1) {
        this.keywords.push(v)
      }
      this.newKeyword = ''
    },
    removeKeyword(index) {
      this.keywords.splice(index, 1)
    },

    handleSearch() {
      if (!this.selectedShipId) {
        ElMessage({ message: '请选择船型！', type: 'warning' })
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
        rows.forEach(row => {
          row.photoList = Array.isArray(row.photo) ? row.photo : []
          row.docList = Array.isArray(row.doc) ? row.doc : []
          row.flowUrl = row.flowUrl || ''
          row.shootingPreview = this.getShootingPreview(row.shooting)
          row.createTimeStr = this.formatDate(row.createTime)
        })
        this.resultList = rows
        this.total = total
        this.totalPages = Math.ceil(total / this.pageSize)
        this.isLoading = false
      }).catch(() => {
        this.isLoading = false
        this.resultList = []
        this.total = 0
        this.totalPages = 0
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
      const m = ('0' + (d.getMonth() + 1)).slice(-2)
      const day = ('0' + d.getDate()).slice(-2)
      return `${m}-${day}`
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
    switchToFlowMode() {
      this.detailTab = 'flow'
      if (!this.detailFlow && !this.flowLoading && !this.flowError) {
        this.loadDetailFlow()
      }
    },
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
          ElMessage({ message: `流程已加载，${errors.length} 处自动修正`, type: 'info' })
        }
      } catch (e) {
        this.flowError = '流程文件加载失败，请检查网络后重试'
      } finally {
        this.flowLoading = false
      }
    },

    openEdit(index) {
      if (this.privilege != 3) {
        ElMessage({ message: '权限不足', type: 'warning' })
        return
      }
      const item = this.resultList[index]
      let steps = ['']
      if (item.shooting) {
        const parts = item.shooting.split(/[；;]/).map(s => s.trim()).filter(s => s)
        if (parts.length > 0) steps = parts
      }
      const photoList = (item.photoList || []).map(url => ({ preview: url, url, uploading: false }))
      const fileList = (item.docList || []).map((url, k) => ({ name: '文件' + (k + 1), url, uploading: false }))
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
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    chooseEditPhoto(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (this.editForm.photoList.length + files.length > 9) {
        ElMessage({ message: '最多上传9张照片！', type: 'warning' })
        return
      }
      const maxSize = 2 * 1024 * 1024
      for (const f of files) {
        if (f.size > maxSize) { ElMessage({ message: '单张不能超过2M', type: 'warning' }); return }
      }
      files.forEach(file => {
        const preview = URL.createObjectURL(file)
        const baseLen = this.editForm.photoList.length
        this.editForm.photoList.push({ preview, url: '', uploading: true })
        uploadFile(file).then(url => {
          this.editForm.photoList[baseLen].url = url
          this.editForm.photoList[baseLen].uploading = false
        }).catch(() => {
          this.editForm.photoList.splice(baseLen, 1)
        })
      })
    },
    chooseEditFile(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      const maxSize = 2 * 1024 * 1024
      for (const f of files) {
        if (f.size > maxSize) { ElMessage({ message: '单个文件不能超过2M', type: 'warning' }); return }
      }
      files.forEach(file => {
        const baseLen = this.editForm.fileList.length
        this.editForm.fileList.push({ name: file.name, url: '', uploading: true })
        uploadFile(file).then(url => {
          this.editForm.fileList[baseLen].url = url
          this.editForm.fileList[baseLen].uploading = false
        }).catch(() => {
          this.editForm.fileList.splice(baseLen, 1)
        })
      })
    },
    joinEditSteps() {
      return this.editForm.steps.map(s => s.trim()).filter(s => s).join('；')
    },
    saveEdit() {
      if (!this.editForm.phenomenon.trim()) { ElMessage({ message: '请输入故障现象', type: 'warning' }); return }
      const shootingStr = this.joinEditSteps()
      if (!shootingStr) { ElMessage({ message: '请至少输入一步排查内容', type: 'warning' }); return }
      for (const p of this.editForm.photoList) { if (p.uploading) { ElMessage({ message: '照片上传中', type: 'warning' }); return } }
      for (const f of this.editForm.fileList) { if (f.uploading) { ElMessage({ message: '文件上传中', type: 'warning' }); return } }
      const submitData = {
        id: this.editForm.id,
        phenomenon: this.editForm.phenomenon.trim(),
        shooting: shootingStr,
        photo: this.editForm.photoList.filter(p => p.url).map(p => p.url),
        doc: this.editForm.fileList.filter(f => f.url).map(f => f.url)
      }
      request.post('/trbsts', submitData).then(res => {
        if (res.data.code === 1) {
          if (this.editDeletedFiles.length > 0) {
            deleteFiles(this.editDeletedFiles)
            this.editDeletedFiles = []
          }
          ElMessage({ message: '保存成功', type: 'success' })
          this.showEditModal = false
          this.fetchData()
        } else {
          ElMessage({ message: res.data.msg || '保存失败', type: 'error' })
        }
      }).catch(() => {
        ElMessage({ message: '保存失败', type: 'error' })
      })
    },

    handleDelete(index) {
      if (this.privilege < 3) { ElMessage({ message: '权限不足', type: 'warning' }); return }
      const item = this.resultList[index]
      ElMessageBox.confirm('确定删除该排查记录吗？删除后不可恢复。', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        if (!item || !item.id) return
        request.delete('/trbsts', { params: { id: item.id } }).then(res => {
          if (res.data.code === 1) {
            ElMessage({ message: '删除成功', type: 'success' })
            const urls = [
              ...(item.photoList || []),
              ...(item.docList || [])
            ]
            if (item.flowUrl) urls.push(item.flowUrl)
            if (urls.length > 0) deleteFiles(urls)
            this.fetchData()
          } else {
            ElMessage({ message: res.data.msg || '删除失败', type: 'error' })
          }
        }).catch(() => {
          ElMessage({ message: '删除失败', type: 'error' })
        })
      }).catch(() => {
        // 用户取消
      })
    }
  }
}
</script>

<style scoped>
.h5-retrieval-page {
  padding-bottom: 8px;
}

/* 搜索卡片 */
.h5-search-card {
  background: #fff;
  border-radius: var(--oc-radius, 10px);
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
}

.h5-search-row {
  margin-bottom: 10px;
}

.h5-search-row:last-child {
  margin-bottom: 0;
}

.h5-ship-select {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--oc-border, #e0e4e8);
  border-radius: 8px;
  background: var(--oc-bg-soft, #fafbfc);
}

.h5-select-label {
  font-size: 13px;
  color: var(--oc-text-light, #999);
  margin-right: 10px;
}

.h5-select-value {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.h5-select-value.placeholder {
  color: var(--oc-text-light, #999);
}

.h5-select-arrow {
  color: var(--oc-text-light, #999);
  font-size: 10px;
  transform: rotate(90deg);
}

.h5-keyword-input {
  padding: 8px 12px;
  border: 1px solid var(--oc-border, #e0e4e8);
  border-radius: 8px;
  background: var(--oc-bg-soft, #fafbfc);
  min-height: 36px;
}

.h5-keyword-placeholder {
  font-size: 14px;
  color: var(--oc-text-light, #999);
}

.h5-keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.h5-kw-tag {
  display: inline-block;
  padding: 3px 8px;
  background: #e8f4ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  font-size: 12px;
  color: var(--oc-primary-dark, #1a5fb4);
}

.h5-kw-more {
  font-size: 12px;
  color: var(--oc-text-light, #999);
  padding: 3px 0;
}

.h5-search-btn {
  width: 100%;
  padding: 11px 0;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 6px;
}

/* 统计 */
.h5-result-stat {
  font-size: 13px;
  color: var(--oc-text, #46587a);
  margin-bottom: 10px;
}

/* 结果卡片 */
.h5-result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.h5-result-card {
  background: #fff;
  border-radius: var(--oc-radius, 10px);
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.h5-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--oc-border, #f0f0f0);
}

.h5-card-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--oc-title, #333);
}

.h5-card-date {
  font-size: 12px;
  color: var(--oc-text-light, #999);
}

.h5-card-line {
  margin-bottom: 8px;
}

.h5-card-line:last-child {
  margin-bottom: 0;
}

.h5-card-label {
  font-size: 12px;
  color: var(--oc-primary-dark, #1a5fb4);
  display: block;
  margin-bottom: 2px;
}

.h5-card-text {
  font-size: 14px;
  color: #555;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.h5-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--oc-border, #f0f0f0);
}

.h5-card-btn {
  padding: 5px 16px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid;
  cursor: pointer;
}

.h5-card-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.h5-edit-btn {
  background: #e8f4ff;
  border-color: #b3d8ff;
  color: var(--oc-primary-dark, #1a5fb4);
}

.h5-delete-btn {
  background: #fef0f0;
  border-color: #fbc4c4;
  color: var(--oc-danger, #ed4014);
}

/* 分页 */
.h5-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 12px 0;
}

.h5-page-btn {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--oc-primary-dark, #1a5fb4);
  background: #fff;
  border: 1px solid var(--oc-primary, #3584e4);
  border-radius: 6px;
  cursor: pointer;
}

.h5-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.h5-page-info {
  font-size: 14px;
  color: var(--oc-text, #46587a);
}

/* 空状态 */
.h5-empty-state,
.h5-loading-state {
  text-align: center;
  padding: 50px 0;
  color: var(--oc-text-light, #999);
  font-size: 14px;
}

.h5-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--oc-border, #e0e4e8);
  border-top-color: var(--oc-primary-dark, #1a5fb4);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 弹窗 */
.h5-modal-overlay {
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
  padding: 16px;
  box-sizing: border-box;
}

.h5-dialog {
  background: #fff;
  border-radius: var(--oc-radius-lg, 12px);
  width: 100%;
  max-width: 400px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 船型底部弹出式选择器 */
.h5-picker-dialog {
  background: #fff;
  border-radius: var(--oc-radius-lg, 12px) var(--oc-radius-lg, 12px) 0 0;
  width: 100%;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  bottom: 0;
  left: 0;
}

/* 弹窗头部：白色 + 底部细线（与 PC el-dialog 一致） */
.h5-picker-header,
.h5-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  color: var(--oc-title, #1a3a6e);
  border-bottom: 1px solid var(--oc-border, #eef1f6);
  flex-shrink: 0;
}

.h5-picker-header span,
.h5-dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.h5-detail-header-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.h5-picker-close,
.h5-dialog-close {
  background: none;
  border: none;
  color: var(--oc-text-light, #999);
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.h5-picker-body {
  overflow-y: auto;
  padding: 8px 0;
}

.h5-picker-item {
  padding: 14px 16px;
  font-size: 15px;
  color: #333;
  border-bottom: 1px solid var(--oc-border, #f0f0f0);
  cursor: pointer;
}

.h5-picker-item.active {
  color: var(--oc-primary-dark, #1a5fb4);
  background: #e8f4ff;
  font-weight: 600;
}

.h5-dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--oc-bg, #f5f7fa);
  -webkit-overflow-scrolling: touch;
}

.h5-dialog-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--oc-border, #eef1f6);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

/* 关键词弹窗 */
.h5-kw-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.h5-kw-close {
  margin-left: 4px;
  color: var(--oc-text-light, #999);
  cursor: pointer;
}

.h5-no-kw {
  font-size: 13px;
  color: var(--oc-text-light, #999);
  margin-bottom: 16px;
}

.h5-kw-input-row {
  display: flex;
  gap: 8px;
}

.h5-kw-input {
  flex: 1;
  height: 38px;
  border: 1px solid var(--oc-border, #e0e4e8);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
}

.h5-kw-add-btn {
  padding: 0 16px;
  font-size: 14px;
  color: #fff;
  background: var(--oc-primary-dark, #1a5fb4);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.h5-dialog-btn {
  width: 100%;
  padding: 10px 0;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 详情弹窗 */
.h5-detail-dialog {
  max-height: 80vh;
}

.h5-detail-time {
  font-size: 12px;
  color: var(--oc-text-light, #999);
  font-weight: 400;
}

.h5-detail-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
}

.h5-detail-tab {
  flex: 1;
  padding: 8px 0;
  font-size: 14px;
  color: var(--oc-text-light, #999);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.h5-detail-tab.active {
  color: #fff;
  background: var(--oc-primary-dark, #1a5fb4);
  font-weight: 600;
}

.h5-flow-wrap {
  min-height: 200px;
}

.h5-flow-wrap .h5-loading-state {
  padding: 30px 0;
}

.h5-flow-wrap .h5-btn-primary {
  margin-top: 8px;
}

/* 详情卡片区块（与 PC 端卡片风格一致） */
.h5-detail-block {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
}

.h5-detail-block:last-child {
  margin-bottom: 0;
}

.h5-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--oc-title, #1a3a6e);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.h5-detail-count {
  font-size: 12px;
  font-weight: 400;
  color: var(--oc-text-light, #999);
}

.h5-detail-text {
  font-size: 14px;
  color: var(--oc-text, #46587a);
  line-height: 1.5;
  margin: 0;
}

.h5-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h5-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: var(--oc-text, #46587a);
  line-height: 1.5;
}

.h5-step-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.h5-step-text {
  flex: 1;
}

.h5-photos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.h5-photo-item {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
}

.h5-docs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.h5-doc-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid var(--oc-border, #eef1f6);
  border-radius: 8px;
  font-size: 13px;
  color: var(--oc-text, #46587a);
  text-decoration: none;
  transition: all 0.2s;
}

.h5-doc-card:active {
  background: var(--oc-bg, #f5f7fa);
}

.h5-doc-icon {
  font-size: 18px;
}

.h5-doc-name {
  font-weight: 500;
}

/* 编辑表单 */
.h5-form-group {
  margin-bottom: 16px;
}

.h5-form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
}

.h5-required {
  color: var(--oc-danger, #ed4014);
}

.h5-textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border: 1px solid var(--oc-border, #e0e4e8);
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
  outline: none;
  font-family: inherit;
  background: var(--oc-bg-soft, #fafbfc);
}

.h5-edit-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h5-edit-step-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.h5-step-input {
  flex: 1;
  height: 38px;
  border: 1px solid var(--oc-border, #e0e4e8);
  border-radius: 8px;
  padding: 0 10px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  background: var(--oc-bg-soft, #fafbfc);
}

.h5-step-del {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--oc-danger, #ed4014);
  cursor: pointer;
}

.h5-add-step-btn {
  width: 100%;
  padding: 8px 0;
  font-size: 13px;
  color: var(--oc-primary-dark, #1a5fb4);
  background: none;
  border: 1px dashed var(--oc-primary-dark, #1a5fb4);
  border-radius: 6px;
  cursor: pointer;
}

.h5-upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.h5-upload-item {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 6px;
  overflow: hidden;
}

.h5-upload-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h5-upload-mask {
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
  font-size: 11px;
}

.h5-upload-del {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
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

.h5-upload-add {
  width: 70px;
  height: 70px;
  border: 1px dashed var(--oc-border, #d0d5dd);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--oc-text-light, #999);
  background: var(--oc-bg-soft, #fafbfc);
  cursor: pointer;
}

.h5-upload-add-file {
  width: 100%;
  height: 40px;
  font-size: 14px;
}

.h5-file-list {
  margin-bottom: 8px;
}

.h5-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: var(--oc-bg-soft, #fafbfc);
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #333;
}

/* 按钮统一渐变蓝风格 */
.h5-btn-cancel,
.h5-btn-submit {
  padding: 8px 22px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
}

.h5-btn-cancel {
  color: var(--oc-primary-dark, #1a5fb4);
  background: #fff;
  border: 1px solid var(--oc-primary, #3584e4);
}

.h5-btn-submit {
  color: #fff;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  border: none;
}

.h5-btn-primary {
  padding: 8px 22px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
