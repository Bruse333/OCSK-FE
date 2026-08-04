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
        <span class="section-icon"><el-icon><Ship /></el-icon></span>
        <span class="form-section-title">船型选择</span>
        <span class="required-mark">*</span>
      </div>
      <div class="ship-select-row">
        <el-select
          v-model="selectedShipId"
          placeholder="请选择船型"
          filterable
          clearable
          class="ship-select"
          @change="onShipChange"
        >
          <el-option
            v-for="item in shipList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
        <el-button :icon="Plus" @click="showAddShipModal = true">添加新船型</el-button>
      </div>
    </div>

    <!-- 故障现象 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-icon"><el-icon><EditPen /></el-icon></span>
        <span class="form-section-title">故障现象</span>
        <span class="required-mark">*</span>
      </div>
      <el-input
        v-model="phenomenon"
        type="textarea"
        :rows="3"
        placeholder="请描述故障现象"
        maxlength="500"
        show-word-limit
      />
    </div>

    <!-- 排查步骤 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-icon"><el-icon><List /></el-icon></span>
        <span class="form-section-title">排查步骤</span>
        <span class="required-mark">*</span>
      </div>
      <div class="steps-container">
        <div v-for="(step, i) in steps" :key="i" class="step-row">
          <span class="step-index-badge">{{ i + 1 }}</span>
          <el-input
            v-model="steps[i]"
            :placeholder="`请输入第 ${i + 1} 步排查内容`"
            class="step-input"
          />
          <el-button
            v-if="steps.length > 1"
            :icon="Close"
            circle
            text
            @click="removeStep(i)"
          />
        </div>
        <el-button class="add-step-btn" text :icon="Plus" @click="addStep">添加一步</el-button>
      </div>
    </div>

    <!-- 照片上传 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-icon"><el-icon><Camera /></el-icon></span>
        <span class="form-section-title">照片上传</span>
        <span class="upload-hint">单文件 &lt; 2M（可多选）</span>
      </div>
      <div class="upload-area">
        <div class="upload-preview-list">
          <div v-for="(photo, i) in photoList" :key="i" class="preview-item">
            <img :src="photo.preview" alt="照片" class="preview-img" />
            <div class="uploading-mask" v-if="photo.uploading">上传中...</div>
            <el-button
              class="preview-delete"
              :icon="Close"
              circle
              size="small"
              @click="removeFile(i, 'photo')"
            />
          </div>
          <label class="upload-trigger" :class="{ 'upload-disabled': privilege < 2 }" v-if="photoList.length < 9">
            <el-icon class="upload-trigger-icon"><Camera /></el-icon>
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
        <span class="section-icon"><el-icon><Paperclip /></el-icon></span>
        <span class="form-section-title">文件上传</span>
        <span class="upload-hint">单文件 &lt; 2M（可多选）</span>
      </div>
      <div class="upload-area">
        <div class="file-list" v-if="fileList.length > 0">
          <div v-for="(file, i) in fileList" :key="i" class="file-item">
            <el-icon class="file-icon-wrap" v-if="file.uploading"><Loading /></el-icon>
            <el-icon class="file-icon-wrap" v-else><Document /></el-icon>
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ file.uploading ? '上传中...' : file.sizeText }}</span>
            </div>
            <el-button :icon="Delete" text @click="removeFile(i, 'file')" />
          </div>
        </div>
        <label class="upload-trigger upload-trigger-file" :class="{ 'upload-disabled': privilege < 2 }">
          <el-icon class="upload-trigger-icon"><Paperclip /></el-icon>
          <span class="upload-trigger-text">选择文件</span>
          <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple @change="chooseFile($event)" :disabled="privilege < 2" hidden />
        </label>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button
        type="primary"
        size="large"
        class="btn-submit-large"
        :disabled="privilege < 2"
        @click="handleSubmit"
      >确认提交</el-button>
    </div>

    <!-- 添加船型弹窗 -->
    <el-dialog
      v-model="showAddShipModal"
      title="添加新船型"
      width="400px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-input
        v-model="newShipName"
        placeholder="请输入船型名称"
        maxlength="20"
        clearable
      />
      <template #footer>
        <el-button @click="cancelAddShip">取消</el-button>
        <el-button type="primary" @click="confirmAddShip">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Close, Delete, Ship, EditPen, List, Camera, Paperclip, Document, Loading } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getPrivilege } from '@/utils/token'
import { deleteFiles } from '@/utils/file'
import { uploadFile } from '@/utils/uploadQueue'

export default {
  name: 'AddRecordPage',
  data() {
    return {
      shipList: [],
      selectedShipId: '',
      selectedShipName: '',
      phenomenon: '',
      steps: [''],
      photoList: [],
      fileList: [],
      showAddShipModal: false,
      newShipName: '',
      privilege: 1,
      // 图标（markRaw 避免组件被响应式化）
      Plus: markRaw(Plus), Close: markRaw(Close), Delete: markRaw(Delete)
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
          this.shipList = res.data.data.map(item => ({ id: item.id, name: item.name }))
        }
      }).catch(() => {
        ElMessage({ message: '获取船型列表失败！', type: 'error' })
      })
    },
    onShipChange(val) {
      const ship = this.shipList.find(s => s.id === val)
      this.selectedShipName = ship ? ship.name : ''
    },
    cancelAddShip() {
      this.showAddShipModal = false
      this.newShipName = ''
    },
    confirmAddShip() {
      const name = this.newShipName.trim()
      if (!name) {
        ElMessage({ message: '请输入船型名称', type: 'warning' })
        return
      }
      request.put('/ships', { name }).then(res => {
        if (res.data.code === 1) {
          ElMessage({ message: '添加成功！', type: 'success' })
          this.showAddShipModal = false
          this.newShipName = ''
          this.fetchShips()
        } else {
          ElMessage({ message: res.data.msg || '添加船型失败', type: 'error' })
        }
      }).catch(() => {
        ElMessage({ message: '添加船型失败，请重试', type: 'error' })
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
    // ====== 文件上传（节流逻辑由 @/utils/uploadQueue 统一管理） ======
    choosePhoto(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (this.privilege < 2) {
        ElMessage({ message: '权限不足，无法上传照片！', type: 'error' })
        return
      }
      if (this.photoList.length + files.length > 9) {
        ElMessage({ message: '最多照片数量不能超过9张！', type: 'warning' })
        return
      }
      const maxSize = 2 * 1024 * 1024
      for (const f of files) {
        if (f.size > maxSize) {
          ElMessage({ message: '单个文件大小不能超过2MB！', type: 'warning' })
          return
        }
      }
      files.forEach(file => {
        const preview = URL.createObjectURL(file)
        const baseLen = this.photoList.length
        this.photoList.push({ preview, url: '', uploading: true })
        uploadFile(file).then(ossUrl => {
          this.photoList[baseLen].url = ossUrl
          this.photoList[baseLen].uploading = false
        }).catch(() => {
          ElMessage({ message: '照片上传失败！', type: 'error' })
          this.photoList.splice(baseLen, 1)
        })
      })
    },
    chooseFile(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (this.privilege < 2) {
        ElMessage({ message: '权限不足，无法上传文件！', type: 'error' })
        return
      }
      const maxSize = 2 * 1024 * 1024
      for (const f of files) {
        if (f.size > maxSize) {
          ElMessage({ message: '单个文件大小不能超过2MB！', type: 'warning' })
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
        uploadFile(file).then(ossUrl => {
          this.fileList[baseLen].url = ossUrl
          this.fileList[baseLen].uploading = false
        }).catch(() => {
          ElMessage({ message: '文件上传失败！', type: 'error' })
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
        ElMessage({ message: '权限不足，无法提交！', type: 'warning' })
        return
      }
      if (!this.selectedShipId) {
        ElMessage({ message: '请选择船型！', type: 'warning' })
        return
      }
      if (!this.phenomenon.trim()) {
        ElMessage({ message: '请输入故障现象！', type: 'warning' })
        return
      }
      const shootingStr = this.joinSteps()
      if (!shootingStr) {
        ElMessage({ message: '请至少输入一条排查步骤！', type: 'warning' })
        return
      }
      for (const p of this.photoList) {
        if (p.uploading) { ElMessage({ message: '图片正在上传中，请稍候！', type: 'warning' }); return }
      }
      for (const f of this.fileList) {
        if (f.uploading) { ElMessage({ message: '文件正在上传中，请稍候！', type: 'warning' }); return }
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
          ElMessage({ message: '上传成功！', type: 'success' })
          this.selectedShipId = ''
          this.selectedShipName = ''
          this.phenomenon = ''
          this.steps = ['']
          this.photoList = []
          this.fileList = []
        } else {
          ElMessage({ message: res.data.msg || '提交失败！', type: 'error' })
        }
      }).catch(() => {
        ElMessage({ message: '提交失败！', type: 'error' })
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
  color: var(--oc-title, #1a3a6e);
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--oc-text-light, #8a94a6);
}

/* 表单卡片 */
.form-card {
  background: #fff;
  border-radius: var(--oc-radius, 10px);
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
  color: #fff;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
}

.form-section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.required-mark {
  color: var(--oc-danger, #ed4014);
  font-size: 15px;
  font-weight: bold;
}

.upload-hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--oc-text-light, #8a94a6);
}

/* 船型选择 */
.ship-select-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ship-select {
  flex: 1;
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
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
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
}

.add-step-btn {
  width: 100%;
  border-style: dashed !important;
  border-color: var(--oc-primary, #3584e4) !important;
  color: var(--oc-primary, #3584e4) !important;
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
  z-index: 1;
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
  transition: all 0.2s;
}

.upload-trigger:hover {
  background: #f0f7ff;
  border-color: var(--oc-primary, #3584e4);
}

.upload-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-disabled:hover {
  background: #fafbfc;
  border-color: #d0d5dd;
}

.upload-trigger-icon {
  font-size: 24px;
  color: var(--oc-text-light, #8a94a6);
}

.upload-trigger-text {
  font-size: 12px;
  color: var(--oc-text-light, #8a94a6);
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
  color: var(--oc-primary, #3584e4);
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
  color: var(--oc-text-light, #8a94a6);
  margin-top: 2px;
}

/* 提交按钮 */
.submit-section {
  margin-top: 8px;
  margin-bottom: 24px;
}

.btn-submit-large {
  width: 100%;
  letter-spacing: 2px;
}
</style>
