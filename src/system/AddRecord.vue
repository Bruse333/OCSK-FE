<template>
  <div class="add-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">添加排查记录</h2>
      <p class="page-subtitle">请填写以下信息完成故障排查记录的新增</p>
    </div>

    <!-- 船型选择 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-icon icon-ship">🚢</span>
        <span class="form-section-title">船型选择</span>
        <span class="required-mark">*</span>
      </div>
      <div class="ship-select-wrapper">
        <div class="ship-select" @click="toggleShipDropdown">
          <span class="ship-select-text" :class="{ selected: selectedShipName }">
            {{ selectedShipName || '请选择船型' }}
          </span>
          <span class="selector-arrow" :class="{ up: showShipDropdown }">&#9662;</span>
        </div>
        <div class="ship-dropdown-list" v-if="showShipDropdown">
          <div v-for="item in shipList" :key="item.id" class="ship-dropdown-item"
            :class="{ active: selectedShipId === item.id }" @click.stop="selectShip(item.id, item.name)">
            <span>{{ item.name }}</span>
            <span v-if="selectedShipId === item.id" class="check-icon">&#10003;</span>
          </div>
          <div class="ship-add-btn" @click.stop="showAddShipModal = true">
            <span>+</span>
            <span>添加新船型</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 故障现象 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-icon icon-step">📝</span>
        <span class="form-section-title">故障现象</span>
        <span class="required-mark">*</span>
      </div>
      <textarea v-model="phenomenon" class="phenomenon-input" placeholder="请描述故障现象" maxlength="500"></textarea>
    </div>

    <!-- 排查步骤 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-icon icon-step">📋</span>
        <span class="form-section-title">排查步骤</span>
        <span class="required-mark">*</span>
      </div>
      <div class="steps-container">
        <div v-for="(step, i) in steps" :key="i" class="step-row">
          <span class="step-index-badge">{{ i + 1 }}</span>
          <input v-model="steps[i]" class="step-input" :placeholder="`请输入第 ${i + 1} 步排查内容`" />
          <button v-if="steps.length > 1" class="step-delete-btn" @click="removeStep(i)">×</button>
        </div>
        <button class="add-step-btn" @click="addStep">+ 添加一步</button>
      </div>
    </div>

    <!-- 照片上传 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-icon icon-photo">📷</span>
        <span class="form-section-title">照片上传</span>
        <span class="upload-hint">单文件 &lt; 2M（可多选）</span>
      </div>
      <div class="upload-area">
        <div class="upload-preview-list">
          <div v-for="(photo, i) in photoList" :key="i" class="preview-item">
            <img :src="photo.preview" alt="照片" class="preview-img" />
            <div class="uploading-mask" v-if="photo.uploading">上传中...</div>
            <button class="preview-delete" @click="removeFile(i, 'photo')">×</button>
          </div>
          <label class="upload-trigger" :class="{ 'upload-disabled': privilege < 2 }" v-if="photoList.length < 9">
            <span>📷</span>
            <span class="upload-trigger-text">选择照片</span>
            <input type="file" accept="image/*" multiple @change="choosePhoto($event)" :disabled="privilege < 2"
              hidden />
          </label>
        </div>
      </div>
    </div>

    <!-- 文件上传 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-icon icon-file">📎</span>
        <span class="form-section-title">文件上传</span>
        <span class="upload-hint">单文件 &lt; 2M（可多选）</span>
      </div>
      <div class="upload-area">
        <div class="file-list" v-if="fileList.length > 0">
          <div v-for="(file, i) in fileList" :key="i" class="file-item">
            <span class="file-icon-wrap">{{ file.uploading ? '⏳' : '📄' }}</span>
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ file.uploading ? '上传中...' : file.sizeText }}</span>
            </div>
            <button class="file-delete" @click="removeFile(i, 'file')">×</button>
          </div>
        </div>
        <label class="upload-trigger upload-trigger-file" :class="{ 'upload-disabled': privilege < 2 }">
          <span>📎</span>
          <span class="upload-trigger-text">选择文件</span>
          <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple @change="chooseFile($event)" :disabled="privilege < 2" hidden />
        </label>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <button class="btn-submit-large" :disabled="privilege < 2" @click="handleSubmit">确认提交</button>
    </div>

    <!-- 添加船型弹窗 -->
    <div class="modal-overlay" v-if="showAddShipModal" @click.self="cancelAddShip">
      <div class="modal-dialog add-ship-modal">
        <div class="modal-header">
          <h2>添加新船型</h2>
          <button class="modal-close" @click="cancelAddShip">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-error" v-if="addShipError">{{ addShipError }}</div>
          <input v-model="newShipName" class="modal-input" placeholder="请输入船型名称" maxlength="20" />
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="cancelAddShip">取消</button>
          <button class="btn-submit" @click="confirmAddShip">确定</button>
        </div>
      </div>
    </div>

    <!-- 提示弹框 
    <transition name="fade">
      <div v-if="alertBox.show" class="alert-overlay" @click.self="closeAlert">
        <div class="alert-dialog">
          <p class="alert-msg">{{ alertBox.msg }}</p>
          <button class="alert-btn" @click="closeAlert">确定</button>
        </div>
      </div>
    </transition> -->
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { getPrivilege } from '@/utils/token'
import { deleteFiles } from '@/utils/file'

export default {
  name: 'AddRecordPage',
  data() {
    return {
      shipList: [],
      selectedShipId: '',
      selectedShipName: '',
      showShipDropdown: false,
      phenomenon: '',
      steps: [''],
      photoList: [],
      fileList: [],
      showAddShipModal: false,
      newShipName: '',
      addShipError: '',
      privilege: 1,
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
          this.shipList = res.data.data.map(item => ({ id: item.id, name: item.name }))
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
    cancelAddShip() {
      this.showAddShipModal = false
      this.newShipName = ''
      this.addShipError = ''
    },
    confirmAddShip() {
      const name = this.newShipName.trim()
      if (!name) {
        ElMessage({
          message: '请输入船型名称',
          type: 'primary',
        })
        return
      }
      this.addShipError = ''
      request.put('/ships', { name }).then(res => {
        if (res.data.code === 1) {
          ElMessage({
          message: '添加成功！',
          type: 'success',
        })
          this.showAddShipModal = false
          this.newShipName = ''
          this.addShipError = ''
          this.fetchShips()
        } else {
          ElMessage({
          message: res.data.msg || '添加船型失败',
          type: 'error',
        })
        }
      }).catch(() => {
        ElMessage({
          message: '添加船型失败，请重试',
          type: 'error',
        })
      })
    },

    // ====== 排查步骤 ======
    addStep() {
      this.steps.push('')
    },
    removeStep(index) {
      this.steps.splice(index, 1)
    },
    joinSteps() {
      return this.steps.map(s => s.trim()).filter(s => s).join(';')
    },

    // ====== 文件上传 ======
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
        if (res.data.code === 1 && res.data.data) {
          return res.data.data
        }
        throw new Error(res.data.msg || '上传失败')
      })
    },
    choosePhoto(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (this.privilege < 2) {
        ElMessage({
          message: '权限不足，无法上传照片！',
          type: 'error',
        })
        return
      }
      if (this.photoList.length + files.length > 9) {
        ElMessage({
          message: '最多照片数量不能超过9张！',
          type: 'warning',
        })
        return
      }
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
        const preview = URL.createObjectURL(file)
        const baseLen = this.photoList.length
        this.photoList.push({ preview, url: '', uploading: true })
        this.uploadFile(file).then(ossUrl => {
          this.photoList[baseLen].url = ossUrl
          this.photoList[baseLen].uploading = false
        }).catch(() => {
          ElMessage({
          message: '照片上传失败！',
          type: 'error',
        })
          this.photoList.splice(baseLen, 1)
        })
      })
    },
    chooseFile(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (this.privilege < 2) {
        ElMessage({
          message: '权限不足，无法上传文件！',
          type: 'error',
        })
        return
      }
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
        const baseLen = this.fileList.length
        this.fileList.push({
          name: file.name,
          sizeText: this.formatFileSize(file.size),
          url: '',
          uploading: true
        })
        this.uploadFile(file).then(ossUrl => {
          this.fileList[baseLen].url = ossUrl
          this.fileList[baseLen].uploading = false
        }).catch(() => {
          ElMessage({
          message: '文件上传失败！',
          type: 'error',
        })
          this.fileList.splice(baseLen, 1)
        })
      })
    },
    removeFile(index, type) {
      if (type === 'photo') {
        const photo = this.photoList[index]
        if (photo && photo.url) deleteFiles(photo.url)
        this.photoList.splice(index, 1)
      } else {
        const file = this.fileList[index]
        if (file && file.url) deleteFiles(file.url)
        this.fileList.splice(index, 1)
      }
    },

    // ====== 提交 ======
    handleSubmit() {
      if (this.privilege < 2) {
        ElMessage({
          message: '权限不足，无法提交！',
          type: 'warning',
        })
        return
      }
      if (!this.selectedShipId) {
        ElMessage({
          message: '请选择船型！',
          type: 'warning',
        })
        return
      }
      if (!this.phenomenon.trim()) {
        ElMessage({
          message: '请输入故障现象！',
          type: 'warning',
        })
        return
      }
      const shootingStr = this.joinSteps()
      if (!shootingStr) {
        ElMessage({
          message: '请至少输入一条排查步骤！',
          type: 'warning',
        })
        return
      }
      for (const p of this.photoList) {
        if (p.uploading) { ElMessage({
          message: '图片正在上传中，请稍候！',
          type: 'warning',
        }); return }
      }
      for (const f of this.fileList) {
        if (f.uploading) { ElMessage({
          message: '文件正在上传中，请稍候！',
          type: 'warning',
        }); return }
      }
      const photoUrls = this.photoList.filter(p => p.url).map(p => p.url)
      const fileUrls = this.fileList.filter(f => f.url).map(f => f.url)
      const submitData = {
        shipId: this.selectedShipId,
        phenomenon: this.phenomenon.trim(),
        shooting: shootingStr,
        photo: photoUrls,
        doc: fileUrls
      }
      request.put('/trbsts', submitData).then(res => {
        if (res.data.code === 1) {
          ElMessage({
          message: '上传成功！',
          type: 'success',
        })
          this.selectedShipId = ''
          this.selectedShipName = ''
          this.phenomenon = ''
          this.steps = ['']
          this.photoList = []
          this.fileList = []
        } else {
          ElMessage({
          message: res.data.msg || '提交失败！',
          type: 'error',
        })
        }
      }).catch(() => {
        ElMessage({
          message: '提交失败！',
          type: 'error',
        })
      })
    }
  }
}
</script>

<style scoped>
.add-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a3a6e;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #999;
}

/* 表单卡片 */
.form-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
}

.section-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
}

.form-section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.required-mark {
  color: #ed4014;
  font-size: 15px;
  font-weight: bold;
}

.upload-hint {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

/* 船型选择 */
.ship-select-wrapper {
  position: relative;
}

.ship-select {
  height: 38px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fafbfc;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 8px;
}

.ship-select-text {
  flex: 1;
  font-size: 14px;
  color: #999;
}

.ship-select-text.selected {
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

.ship-dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 100;
  max-height: 280px;
  overflow-y: auto;
}

.ship-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.ship-dropdown-item:last-child {
  border-bottom: none;
}

.ship-dropdown-item:hover {
  background: #f0f7ff;
}

.ship-dropdown-item.active {
  color: #1E90FF;
  background: #e8f4ff;
  font-weight: 500;
}

.check-icon {
  color: #1E90FF;
  font-size: 14px;
}

.ship-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  color: #1E90FF;
  font-size: 13px;
  cursor: pointer;
  border-top: 1px solid #f0f0f0;
}

.ship-add-btn:hover {
  background: #f0f7ff;
}

/* 故障现象 */
.phenomenon-input {
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

.phenomenon-input:focus {
  border-color: #3584e4;
}

/* 排查步骤 */
.steps-container {
  width: 100%;
}

.step-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.step-index-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1E90FF, #1565c0);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-input {
  flex: 1;
  height: 38px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  background: #fafbfc;
  outline: none;
  box-sizing: border-box;
}

.step-input:focus {
  border-color: #3584e4;
}

.step-delete-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #ed4014;
  cursor: pointer;
  padding: 0 8px;
}

.add-step-btn {
  width: 100%;
  padding: 8px 0;
  font-size: 13px;
  color: #1E90FF;
  background: none;
  border: 1px dashed #1E90FF;
  border-radius: 6px;
  cursor: pointer;
}

.add-step-btn:hover {
  background: #f0f7ff;
}

/* 上传区域 */
.upload-area {
  width: 100%;
}

.upload-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploading-mask {
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

.preview-delete {
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

.upload-trigger {
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

.upload-trigger:hover {
  background: #f0f0f0;
}

.upload-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-disabled:hover {
  background: #fafbfc;
}

.upload-trigger-text {
  font-size: 12px;
  color: #999;
}

.upload-trigger-file {
  width: 100%;
  height: 50px;
  flex-direction: row;
  margin-top: 12px;
}

/* 文件列表 */
.file-list {
  width: 100%;
  margin-bottom: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #fafbfc;
  border: 1px solid #e8ecf0;
  border-radius: 8px;
  margin-bottom: 8px;
  gap: 10px;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-icon-wrap {
  font-size: 18px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.file-delete {
  background: none;
  border: none;
  font-size: 16px;
  color: #c0c4cc;
  cursor: pointer;
  padding: 0 8px;
}

.file-delete:hover {
  color: #ed4014;
}

/* 提交按钮 */
.submit-section {
  margin-top: 8px;
  margin-bottom: 24px;
}

.btn-submit-large {
  width: 100%;
  padding: 12px 0;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.2s;
}

.btn-submit-large:hover {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
}

.btn-submit-large:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 弹窗 */
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.add-ship-modal {
  width: 400px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  color: #fff;
}

.modal-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
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
  padding: 20px 24px;
}

.modal-error {
  color: #ed4014;
  font-size: 13px;
  margin-bottom: 12px;
}

.modal-input {
  width: 100%;
  height: 38px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  background: #fafbfc;
  outline: none;
  box-sizing: border-box;
}

.modal-input:focus {
  border-color: #3584e4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

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