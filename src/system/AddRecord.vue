<template>
  <div class="add-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">添加排查记录</h2>
      <p class="page-subtitle">填写故障现象与排查步骤，沉淀为可检索的知识</p>
    </div>

    <!-- 1 船型选择 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-num">1</span>
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

    <!-- 2 故障现象 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-num">2</span>
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

    <!-- 3 排查步骤 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-num">3</span>
        <span class="form-section-title">排查步骤</span>
        <span class="required-mark">*</span>
      </div>
      <div class="steps-container">
        <div v-for="(step, i) in steps" :key="i" class="step-row">
          <span class="step-index-badge">{{ i + 1 }}</span>
          <el-input
            v-model="steps[i]"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :placeholder="`请输入第 ${i + 1} 步排查内容`"
            class="step-input"
          />
          <el-button
            v-if="steps.length > 1"
            class="step-delete-btn"
            :icon="Close"
            circle
            text
            @click="removeStep(i)"
          />
        </div>
        <el-button class="add-step-btn" text :icon="Plus" @click="addStep">添加一步</el-button>
      </div>
    </div>

    <!-- 4 照片上传 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-num">4</span>
        <span class="form-section-title">照片上传</span>
        <span class="upload-hint">最多 9 张，单张 &lt; 2M</span>
      </div>
      <div class="upload-preview-list" v-if="photoList.length > 0">
        <div v-for="(photo, i) in photoList" :key="i" class="preview-item">
          <img :src="photo.preview" alt="照片" class="preview-img" />
          <div class="uploading-mask" v-if="photo.uploading">上传中...</div>
          <div class="preview-hover-mask" v-else>
            <el-button
              class="preview-delete"
              :icon="Close"
              circle
              size="small"
              @click="removeFile(i, 'photo')"
            />
          </div>
        </div>
      </div>
      <label
        v-if="photoList.length < 9"
        class="upload-dropzone"
        :class="{ 'upload-disabled': privilege < 2 }"
        @dragover.prevent
        @drop.prevent="onDropPhoto"
      >
        <el-icon class="dropzone-icon"><Camera /></el-icon>
        <span class="dropzone-text">点击或拖拽上传</span>
        <span class="dropzone-hint">最多 9 张，单张 &lt; 2M</span>
        <input type="file" accept="image/*" multiple @change="choosePhoto($event)" :disabled="privilege < 2" hidden />
      </label>
    </div>

    <!-- 5 文件上传 -->
    <div class="form-card">
      <div class="form-section-header">
        <span class="section-num">5</span>
        <span class="form-section-title">文件上传</span>
        <span class="upload-hint">支持 PDF / DOC / DOCX，单个 &lt; 2M</span>
      </div>
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
      <label
        class="upload-dropzone"
        :class="{ 'upload-disabled': privilege < 2 }"
        @dragover.prevent
        @drop.prevent="onDropFile"
      >
        <el-icon class="dropzone-icon"><Paperclip /></el-icon>
        <span class="dropzone-text">点击或拖拽上传</span>
        <span class="dropzone-hint">支持 PDF / DOC / DOCX，单个 &lt; 2M</span>
        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple @change="chooseFile($event)" :disabled="privilege < 2" hidden />
      </label>
    </div>

    <!-- 吸底操作条 -->
    <div class="submit-bar">
      <span class="submit-tip" v-if="privilege < 2">当前账号无上传权限</span>
      <div class="submit-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          class="btn-submit"
          :disabled="privilege < 2"
          @click="handleSubmit"
        >提交记录</el-button>
      </div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Close, Delete, Camera, Paperclip, Document, Loading } from '@element-plus/icons-vue'
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
      this.addPhotoFiles(files)
    },
    onDropPhoto(e) {
      const files = Array.from(e.dataTransfer.files)
      this.addPhotoFiles(files)
    },
    addPhotoFiles(files) {
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
      this.addDocFiles(files)
    },
    onDropFile(e) {
      const files = Array.from(e.dataTransfer.files)
      this.addDocFiles(files)
    },
    addDocFiles(files) {
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

    // ====== 取消（清空表单，已传 OSS 文件一并清理） ======
    handleCancel() {
      ElMessageBox.confirm('确定要清空已填写的内容吗？', '取消编辑', {
        confirmButtonText: '清空',
        cancelButtonText: '继续编辑',
        type: 'warning'
      }).then(() => {
        const urls = [
          ...this.photoList.filter(p => p.url).map(p => p.url),
          ...this.fileList.filter(f => f.url).map(f => f.url)
        ]
        if (urls.length > 0) deleteFiles(urls)
        this.selectedShipId = ''
        this.selectedShipName = ''
        this.phenomenon = ''
        this.steps = ['']
        this.photoList = []
        this.fileList = []
      }).catch(() => {
        // 用户取消，不做处理
      })
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
  max-width: 880px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: var(--oc-text-2xl);
  font-weight: 600;
  color: var(--oc-gray-900);
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-400);
}

/* 表单卡片 */
.form-card {
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: var(--oc-radius-md);
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: var(--oc-shadow-sm);
}

.form-section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
}

/* 编号方块：浅蓝底 + 品牌蓝字 */
.section-num {
  width: 28px;
  height: 28px;
  border-radius: var(--oc-radius);
  background: var(--oc-blue-50);
  color: var(--oc-blue-600);
  font-size: var(--oc-text-md);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.form-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--oc-gray-900);
}

.required-mark {
  margin-left: auto;
  color: var(--oc-danger);
  font-size: 15px;
  font-weight: 600;
}

.upload-hint {
  margin-left: auto;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
  font-weight: 400;
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
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 10px;
}

/* 步骤序号：浅蓝底 + 蓝色描边圆环（规范 9.5） */
.step-index-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--oc-primary-bg);
  color: var(--oc-primary-dark);
  border: 1.5px solid var(--oc-primary);
  font-size: var(--oc-text-xs);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 6px;
}

.step-input {
  flex: 1;
}

.step-delete-btn {
  margin-top: 6px;
  color: var(--oc-gray-400);
}

.step-delete-btn:hover {
  color: var(--oc-danger);
}

/* 添加一步：整宽虚线按钮，hover 蓝底蓝字 */
.add-step-btn {
  width: 100%;
  border: 1px dashed var(--oc-gray-300) !important;
  border-radius: var(--oc-radius) !important;
  color: var(--oc-blue-600) !important;
}

.add-step-btn:hover {
  background: var(--oc-blue-50) !important;
  border-color: var(--oc-blue-400) !important;
}

/* 已传图片缩略图：80×80，hover 删除蒙层 */
.upload-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--oc-radius);
  overflow: hidden;
  border: 1px solid var(--oc-border-light);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploading-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--oc-text-xs);
}

.preview-hover-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.preview-item:hover .preview-hover-mask {
  opacity: 1;
}

/* 整宽虚线拖拽上传框 */
.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 28px 16px;
  border: 1.5px dashed var(--oc-gray-300);
  border-radius: var(--oc-radius-md);
  background: var(--oc-gray-50);
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: var(--oc-blue-400);
  background: var(--oc-blue-50);
}

.dropzone-icon {
  font-size: 32px;
  color: var(--oc-gray-400);
  transition: color 0.2s ease;
}

.upload-dropzone:hover .dropzone-icon {
  color: var(--oc-blue-600);
}

.dropzone-text {
  font-size: var(--oc-text-md);
  color: var(--oc-gray-700);
  font-weight: 500;
}

.dropzone-hint {
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
}

.upload-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-disabled:hover {
  border-color: var(--oc-gray-300);
  background: var(--oc-gray-50);
}

.upload-disabled:hover .dropzone-icon {
  color: var(--oc-gray-400);
}

/* 文件列表 */
.file-list {
  width: 100%;
  margin-bottom: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: var(--oc-gray-50);
  border: 1px solid var(--oc-border-light);
  border-radius: var(--oc-radius);
  margin-bottom: 8px;
  gap: 10px;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-icon-wrap {
  font-size: 18px;
  flex-shrink: 0;
  color: var(--oc-blue-600);
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-900);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 11px;
  color: var(--oc-gray-400);
  margin-top: 2px;
}

/* 吸底操作条 */
.submit-bar {
  position: sticky;
  bottom: 24px;
  display: flex;
  align-items: center;
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: var(--oc-radius-md);
  box-shadow: var(--oc-shadow-lg);
  padding: 12px 20px;
  margin-bottom: 24px;
}

.submit-tip {
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-400);
}

.submit-actions {
  margin-left: auto;
  display: flex;
  gap: 12px;
}

.btn-submit {
  width: 120px;
}
</style>
