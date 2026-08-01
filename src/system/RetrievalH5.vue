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
            :class="{ disabled: privilege < 2 }"
            :disabled="privilege < 2"
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

    <!-- 船型选择器弹窗 -->
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

    <!-- 详情弹窗 -->
    <div class="h5-modal-overlay" v-if="showDetailModal" @click.self="closeDetail">
      <div class="h5-dialog h5-detail-dialog">
        <div class="h5-dialog-header">
          <h3>{{ currentDetail.name }}</h3>
          <button class="h5-dialog-close" @click="closeDetail">×</button>
        </div>
        <div class="h5-dialog-body">
          <p class="h5-detail-time">{{ currentDetail.createTimeStr }}</p>
          <div class="h5-detail-block">
            <div class="h5-detail-title">故障现象</div>
            <p>{{ currentDetail.phenomenon }}</p>
          </div>
          <div class="h5-detail-block">
            <div class="h5-detail-title">排查步骤</div>
            <div class="h5-steps">
              <div v-for="(step, i) in currentDetail.shootingSteps" :key="i" class="h5-step">
                <span class="h5-step-index">{{ i + 1 }}</span>
                <span>{{ step }}</span>
              </div>
            </div>
          </div>
          <div class="h5-detail-block" v-if="currentDetail.photoList && currentDetail.photoList.length > 0">
            <div class="h5-detail-title">图片附件</div>
            <div class="h5-photos">
              <a v-for="(url, i) in currentDetail.photoList" :key="i" :href="url" target="_blank">
                <img :src="url" alt="照片" />
              </a>
            </div>
          </div>
          <div class="h5-detail-block" v-if="currentDetail.docList && currentDetail.docList.length > 0">
            <div class="h5-detail-title">文档附件</div>
            <div class="h5-docs">
              <a v-for="(url, i) in currentDetail.docList" :key="i" :href="url" target="_blank" class="h5-doc-link">
                📄 文件{{ i + 1 }}
              </a>
            </div>
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
                <span>{{ file.uploading ? '⏳' : '📄' }} {{ file.name }}</span>
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

    <!-- 删除确认 -->
    <div class="h5-modal-overlay" v-if="showDeleteConfirm" @click.self="showDeleteConfirm = false">
      <div class="h5-confirm-dialog">
        <p class="h5-confirm-msg">确定删除该记录吗？</p>
        <div class="h5-confirm-btns">
          <button class="h5-btn-cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="h5-btn-delete" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>

    <!-- 提示弹框 -->
    <transition name="fade">
      <div v-if="alertBox.show" class="h5-alert-overlay" @click.self="closeAlert">
        <div class="h5-alert-dialog">
          <p class="h5-alert-msg">{{ alertBox.msg }}</p>
          <button class="h5-alert-btn" @click="closeAlert">确定</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import request from '@/utils/request'
import { getUsername, getPrivilege } from '@/utils/token'
import { deleteFiles } from '@/utils/file'

export default {
  name: 'RetrievalPageH5',
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

    fetchShips() {
      request.get('/ships').then(res => {
        if (res.data.code === 1 && res.data.data) {
          this.shipList = res.data.data.map(item => ({ shipId: item.id, name: item.name }))
        }
      }).catch(() => {
        this.showAlert('获取船型列表失败！')
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
        this.showAlert('请选择船型！')
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
      this.showDetailModal = true
    },
    closeDetail() {
      this.showDetailModal = false
      this.currentDetail = null
    },

    openEdit(index) {
      if (this.privilege < 2) {
        this.showAlert('权限不足')
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
    uploadFile(file) {
      const formData = new FormData()
      formData.append('file', file)
      return request.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(res => {
        if (res.data.code === 1 && res.data.data) return res.data.data
        throw new Error(res.data.msg || '上传失败')
      })
    },
    chooseEditPhoto(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (this.editForm.photoList.length + files.length > 9) {
        this.showAlert('最多上传9张照片！')
        return
      }
      const maxSize = 2 * 1024 * 1024
      for (const f of files) {
        if (f.size > maxSize) { this.showAlert('单张不能超过2M'); return }
      }
      files.forEach(file => {
        const preview = URL.createObjectURL(file)
        const baseLen = this.editForm.photoList.length
        this.editForm.photoList.push({ preview, url: '', uploading: true })
        this.uploadFile(file).then(url => {
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
        if (f.size > maxSize) { this.showAlert('单个文件不能超过2M'); return }
      }
      files.forEach(file => {
        const baseLen = this.editForm.fileList.length
        this.editForm.fileList.push({ name: file.name, url: '', uploading: true })
        this.uploadFile(file).then(url => {
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
      if (!this.editForm.phenomenon.trim()) { this.showAlert('请输入故障现象'); return }
      const shootingStr = this.joinEditSteps()
      if (!shootingStr) { this.showAlert('请至少输入一步排查内容'); return }
      for (const p of this.editForm.photoList) { if (p.uploading) { this.showAlert('照片上传中'); return } }
      for (const f of this.editForm.fileList) { if (f.uploading) { this.showAlert('文件上传中'); return } }
      const submitData = {
        id: this.editForm.id,
        phenomenon: this.editForm.phenomenon.trim(),
        shooting: shootingStr,
        photo: this.editForm.photoList.filter(p => p.url).map(p => p.url),
        doc: this.editForm.fileList.filter(f => f.url).map(f => f.url)
      }
      request.post('/trbsts', submitData).then(res => {
        if (res.data.code === 1) {
          // 提交编辑期间被删除的源文件到后端清理
          if (this.editDeletedFiles.length > 0) {
            deleteFiles(this.editDeletedFiles)
            this.editDeletedFiles = []
          }
          this.showAlert('保存成功')
          this.showEditModal = false
          this.fetchData()
        } else {
          this.showAlert(res.data.msg || '保存失败')
        }
      }).catch(() => {
        this.showAlert('保存失败')
      })
    },

    handleDelete(index) {
      if (this.privilege < 3) { this.showAlert('权限不足'); return }
      this.deleteIndex = index
      this.showDeleteConfirm = true
    },
    confirmDelete() {
      this.showDeleteConfirm = false
      const item = this.resultList[this.deleteIndex]
      if (!item || !item.id) return
      request.delete('/trbsts', { params: { id: item.id } }).then(res => {
        if (res.data.code === 1) {
          this.showAlert('删除成功')
          // 删除该记录关联的所有源文件
          const urls = [
            ...(item.photoList || []),
            ...(item.docList || [])
          ]
          if (urls.length > 0) deleteFiles(urls)
          this.fetchData()
        } else {
          this.showAlert(res.data.msg || '删除失败')
        }
      }).catch(() => {
        this.showAlert('删除失败')
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
  border-radius: 10px;
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
  border: 1px solid #e0e4e8;
  border-radius: 8px;
  background: #fafbfc;
}

.h5-select-label {
  font-size: 13px;
  color: #999;
  margin-right: 10px;
}

.h5-select-value {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.h5-select-value.placeholder {
  color: #999;
}

.h5-select-arrow {
  color: #999;
  font-size: 10px;
  transform: rotate(90deg);
}

.h5-keyword-input {
  padding: 8px 12px;
  border: 1px solid #e0e4e8;
  border-radius: 8px;
  background: #fafbfc;
  min-height: 36px;
}

.h5-keyword-placeholder {
  font-size: 14px;
  color: #999;
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
  color: #1a5fb4;
}

.h5-kw-more {
  font-size: 12px;
  color: #999;
  padding: 3px 0;
}

.h5-search-btn {
  width: 100%;
  padding: 11px 0;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 6px;
}

/* 统计 */
.h5-result-stat {
  font-size: 13px;
  color: #666;
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
  border-radius: 10px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.h5-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.h5-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.h5-card-date {
  font-size: 12px;
  color: #999;
}

.h5-card-line {
  margin-bottom: 8px;
}

.h5-card-line:last-child {
  margin-bottom: 0;
}

.h5-card-label {
  font-size: 12px;
  color: #1a5fb4;
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
  border-top: 1px solid #f0f0f0;
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
  color: #1a5fb4;
}

.h5-delete-btn {
  background: #fef0f0;
  border-color: #fbc4c4;
  color: #ed4014;
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
  color: #1a5fb4;
  background: #fff;
  border: 1px solid #3584e4;
  border-radius: 6px;
  cursor: pointer;
}

.h5-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.h5-page-info {
  font-size: 14px;
  color: #666;
}

/* 空状态 */
.h5-empty-state,
.h5-loading-state {
  text-align: center;
  padding: 50px 0;
  color: #999;
  font-size: 14px;
}

.h5-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e0e4e8;
  border-top-color: #1a5fb4;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
  box-sizing: border-box;
}

.h5-dialog {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.h5-picker-dialog {
  background: #fff;
  border-radius: 12px 12px 0 0;
  width: 100%;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  bottom: 0;
  left: 0;
}

.h5-picker-header,
.h5-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  color: #fff;
  flex-shrink: 0;
}

.h5-picker-header span,
.h5-dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.h5-picker-close,
.h5-dialog-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}

.h5-picker-body {
  overflow-y: auto;
  padding: 8px 0;
}

.h5-picker-item {
  padding: 14px 16px;
  font-size: 15px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.h5-picker-item.active {
  color: #1a5fb4;
  background: #e8f4ff;
  font-weight: 600;
}

.h5-dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

.h5-dialog-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
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
  color: #999;
  cursor: pointer;
}

.h5-no-kw {
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}

.h5-kw-input-row {
  display: flex;
  gap: 8px;
}

.h5-kw-input {
  flex: 1;
  height: 38px;
  border: 1px solid #e0e4e8;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
}

.h5-kw-add-btn {
  padding: 0 16px;
  font-size: 14px;
  color: #fff;
  background: #1a5fb4;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.h5-dialog-btn {
  width: 100%;
  padding: 10px 0;
  font-size: 15px;
  color: #fff;
  background: #1a5fb4;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 详情 */
.h5-detail-dialog {
  max-height: 80vh;
}

.h5-detail-time {
  font-size: 12px;
  color: #999;
  margin-top: 0;
  margin-bottom: 12px;
}

.h5-detail-block {
  margin-bottom: 16px;
}

.h5-detail-block:last-child {
  margin-bottom: 0;
}

.h5-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a5fb4;
  margin-bottom: 8px;
}

.h5-detail-block p {
  font-size: 14px;
  color: #555;
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
  color: #555;
  line-height: 1.5;
}

.h5-step-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1a5fb4;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.h5-photos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.h5-photos img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

.h5-docs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.h5-doc-link {
  padding: 8px 12px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  text-decoration: none;
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
  color: #ed4014;
}

.h5-textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border: 1px solid #e0e4e8;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
  outline: none;
  font-family: inherit;
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
  border: 1px solid #e0e4e8;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.h5-step-del {
  background: none;
  border: none;
  font-size: 18px;
  color: #ed4014;
  cursor: pointer;
}

.h5-add-step-btn {
  width: 100%;
  padding: 8px 0;
  font-size: 13px;
  color: #1a5fb4;
  background: none;
  border: 1px dashed #1a5fb4;
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
  border: 1px dashed #d0d5dd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999;
  background: #fafbfc;
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
  background: #fafbfc;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #333;
}

.h5-btn-cancel,
.h5-btn-submit,
.h5-btn-delete {
  padding: 8px 22px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
}

.h5-btn-cancel {
  color: #1a5fb4;
  background: #fff;
  border: 1px solid #3584e4;
}

.h5-btn-submit {
  color: #fff;
  background: #1a5fb4;
  border: none;
}

.h5-btn-delete {
  color: #fff;
  background: #ed4014;
  border: none;
}

/* 删除确认 */
.h5-confirm-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 300px;
}

.h5-confirm-msg {
  font-size: 15px;
  color: #333;
  text-align: center;
  margin: 0 0 20px;
}

.h5-confirm-btns {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 提示弹框 */
.h5-alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.h5-alert-dialog {
  background: #fff;
  border-radius: 10px;
  width: 80vw;
  max-width: 300px;
  overflow: hidden;
}

.h5-alert-msg {
  margin: 0;
  padding: 24px 20px;
  font-size: 15px;
  color: #333;
  text-align: center;
  line-height: 1.5;
}

.h5-alert-btn {
  display: block;
  width: 100%;
  padding: 12px 0;
  font-size: 15px;
  color: #fff;
  background: #1a5fb4;
  border: none;
  cursor: pointer;
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
