<template>
  <div class="h5-add-page">
    <!-- 船型选择 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span>🚢</span>
        <span>船型选择</span>
        <span class="h5-required">*</span>
      </div>
      <div class="h5-select-box" @click="showShipPicker = true">
        <span :class="{ placeholder: !selectedShipName }">{{ selectedShipName || '请选择船型' }}</span>
        <span class="h5-arrow">&#9654;</span>
      </div>
    </div>

    <!-- 故障现象 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span>📝</span>
        <span>故障现象</span>
        <span class="h5-required">*</span>
      </div>
      <textarea v-model="phenomenon" class="h5-textarea" placeholder="请描述故障现象"></textarea>
    </div>

    <!-- 排查步骤 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span>📋</span>
        <span>排查步骤</span>
        <span class="h5-required">*</span>
      </div>
      <div class="h5-steps">
        <div v-for="(step, i) in steps" :key="i" class="h5-step-row">
          <span class="h5-step-index">{{ i + 1 }}</span>
          <input v-model="steps[i]" class="h5-step-input" :placeholder="`第${i + 1}步`" />
          <button v-if="steps.length > 1" class="h5-step-del" @click="removeStep(i)">×</button>
        </div>
        <button class="h5-add-step-btn" @click="addStep">+ 添加一步</button>
      </div>
    </div>

    <!-- 照片上传 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span>📷</span>
        <span>照片上传</span>
        <span class="h5-hint">单张 &lt; 2M</span>
      </div>
      <div class="h5-upload-list">
        <div v-for="(photo, i) in photoList" :key="i" class="h5-upload-item">
          <img :src="photo.preview" alt="照片" />
          <div class="h5-upload-mask" v-if="photo.uploading">上传中</div>
          <button class="h5-upload-del" @click="removeFile(i, 'photo')">×</button>
        </div>
        <label class="h5-upload-add" v-if="photoList.length < 9">
          <span>+</span>
          <input type="file" accept="image/*" multiple @change="choosePhoto($event)" hidden />
        </label>
      </div>
    </div>

    <!-- 文件上传 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span>📎</span>
        <span>文件上传</span>
        <span class="h5-hint">单个 &lt; 2M</span>
      </div>
      <div class="h5-file-list" v-if="fileList.length > 0">
        <div v-for="(file, i) in fileList" :key="i" class="h5-file-item">
          <span>{{ file.uploading ? '⏳' : '📄' }} {{ file.name }}</span>
          <button class="h5-upload-del" @click="removeFile(i, 'file')">×</button>
        </div>
      </div>
      <label class="h5-upload-add h5-upload-add-file">
        <span>+ 选择文件</span>
        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple @change="chooseFile($event)" hidden />
      </label>
    </div>

    <!-- 提交按钮 -->
    <div class="h5-submit-wrap">
      <button class="h5-submit-btn" :disabled="privilege < 2" @click="handleSubmit">确认提交</button>
    </div>

    <!-- 船型选择器（底部弹出） -->
    <div class="h5-modal-overlay" v-if="showShipPicker" @click.self="showShipPicker = false">
      <div class="h5-picker-dialog">
        <div class="h5-picker-header">
          <span>选择船型</span>
          <button class="h5-picker-close" @click="showShipPicker = false">×</button>
        </div>
        <div class="h5-picker-body">
          <div
            v-for="item in shipList"
            :key="item.id"
            class="h5-picker-item"
            :class="{ active: selectedShipId === item.id }"
            @click="selectShip(item.id, item.name)"
          >
            {{ item.name }}
          </div>
          <div class="h5-picker-add" @click="showAddShipModal = true">
            <span>+</span>
            <span>添加新船型</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加船型弹窗 -->
    <div class="h5-modal-overlay" v-if="showAddShipModal" @click.self="cancelAddShip">
      <div class="h5-confirm-dialog">
        <div class="h5-confirm-title">添加新船型</div>
        <input v-model="newShipName" class="h5-confirm-input" placeholder="请输入船型名称" maxlength="20" />
        <div class="h5-confirm-btns">
          <button class="h5-btn-cancel" @click="cancelAddShip">取消</button>
          <button class="h5-btn-submit" @click="confirmAddShip">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { getPrivilege } from '@/utils/token'
import { deleteFiles } from '@/utils/file'
import { uploadFile } from '@/utils/uploadQueue'

export default {
  name: 'AddRecordPageH5',
  data() {
    return {
      shipList: [],
      selectedShipId: '',
      selectedShipName: '',
      showShipPicker: false,
      phenomenon: '',
      steps: [''],
      photoList: [],
      fileList: [],
      showAddShipModal: false,
      newShipName: '',
      privilege: 1
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
          this.shipList = res.data.data.map(item => ({ id: item.id, name: item.name }))
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
    cancelAddShip() {
      this.showAddShipModal = false
      this.newShipName = ''
    },
    confirmAddShip() {
      const name = this.newShipName.trim()
      if (!name) { ElMessage({ message: '请输入船型名称', type: 'warning' }); return }
      request.put('/ships', { name }).then(res => {
        if (res.data.code === 1) {
          ElMessage({ message: '添加成功', type: 'success' })
          this.showAddShipModal = false
          this.newShipName = ''
          this.fetchShips()
        } else {
          ElMessage({ message: res.data.msg || '添加失败', type: 'error' })
        }
      }).catch(() => {
        ElMessage({ message: '添加失败，请重试', type: 'error' })
      })
    },

    addStep() {
      this.steps.push('')
    },
    removeStep(index) {
      this.steps.splice(index, 1)
    },
    joinSteps() {
      return this.steps.map(s => s.trim()).filter(s => s).join(';')
    },

    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    // ====== 文件上传（节流逻辑由 @/utils/uploadQueue 统一管理） ======
    choosePhoto(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (this.privilege < 2) { ElMessage({ message: '权限不足', type: 'error' }); return }
      if (this.photoList.length + files.length > 9) { ElMessage({ message: '最多9张照片', type: 'warning' }); return }
      const maxSize = 2 * 1024 * 1024
      for (const f of files) { if (f.size > maxSize) { ElMessage({ message: '单张不能超过2M', type: 'warning' }); return } }
      files.forEach(file => {
        const preview = URL.createObjectURL(file)
        const baseLen = this.photoList.length
        this.photoList.push({ preview, url: '', uploading: true })
        uploadFile(file).then(url => {
          this.photoList[baseLen].url = url
          this.photoList[baseLen].uploading = false
        }).catch(() => {
          this.photoList.splice(baseLen, 1)
        })
      })
    },
    chooseFile(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (this.privilege < 2) { ElMessage({ message: '权限不足', type: 'error' }); return }
      const maxSize = 2 * 1024 * 1024
      for (const f of files) { if (f.size > maxSize) { ElMessage({ message: '单个文件不能超过2M', type: 'warning' }); return } }
      files.forEach(file => {
        const baseLen = this.fileList.length
        this.fileList.push({ name: file.name, sizeText: this.formatFileSize(file.size), url: '', uploading: true })
        uploadFile(file).then(url => {
          this.fileList[baseLen].url = url
          this.fileList[baseLen].uploading = false
        }).catch(() => {
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

    handleSubmit() {
      if (this.privilege < 2) { ElMessage({ message: '权限不足', type: 'warning' }); return }
      if (!this.selectedShipId) { ElMessage({ message: '请选择船型', type: 'warning' }); return }
      if (!this.phenomenon.trim()) { ElMessage({ message: '请输入故障现象', type: 'warning' }); return }
      const shootingStr = this.joinSteps()
      if (!shootingStr) { ElMessage({ message: '请至少输入一步排查内容', type: 'warning' }); return }
      for (const p of this.photoList) { if (p.uploading) { ElMessage({ message: '照片上传中', type: 'warning' }); return } }
      for (const f of this.fileList) { if (f.uploading) { ElMessage({ message: '文件上传中', type: 'warning' }); return } }
      const submitData = {
        shipId: this.selectedShipId,
        phenomenon: this.phenomenon.trim(),
        shooting: shootingStr,
        photo: this.photoList.filter(p => p.url).map(p => p.url),
        doc: this.fileList.filter(f => f.url).map(f => f.url)
      }
      request.put('/trbsts', submitData).then(res => {
        if (res.data.code === 1) {
          ElMessage({ message: '提交成功', type: 'success' })
          this.selectedShipId = ''
          this.selectedShipName = ''
          this.phenomenon = ''
          this.steps = ['']
          this.photoList = []
          this.fileList = []
        } else {
          ElMessage({ message: res.data.msg || '提交失败', type: 'error' })
        }
      }).catch(() => {
        ElMessage({ message: '提交失败', type: 'error' })
      })
    }
  }
}
</script>

<style scoped>
.h5-add-page {
  padding-bottom: 12px;
}

.h5-form-card {
  background: #fff;
  border-radius: var(--oc-radius, 10px);
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.h5-form-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--oc-title, #333);
}

.h5-required {
  color: var(--oc-danger, #ed4014);
}

.h5-hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--oc-text-light, #999);
  font-weight: normal;
}

.h5-select-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 12px;
  border: 1px solid var(--oc-border, #e0e4e8);
  border-radius: 8px;
  background: var(--oc-bg-soft, #fafbfc);
  font-size: 15px;
  color: #333;
}

.h5-select-box .placeholder {
  color: var(--oc-text-light, #999);
}

.h5-arrow {
  color: var(--oc-text-light, #999);
  font-size: 10px;
  transform: rotate(90deg);
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

.h5-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h5-step-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.h5-step-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.h5-submit-wrap {
  margin-top: 4px;
  margin-bottom: 12px;
}

.h5-submit-btn {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  color: #fff;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.h5-submit-btn:disabled {
  opacity: 0.5;
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

.h5-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  color: var(--oc-title, #1a3a6e);
  border-bottom: 1px solid var(--oc-border, #eef1f6);
}

.h5-picker-header span {
  font-size: 16px;
  font-weight: 600;
}

.h5-picker-close {
  background: none;
  border: none;
  color: var(--oc-text-light, #999);
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
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

.h5-picker-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px;
  color: var(--oc-primary-dark, #1a5fb4);
  font-size: 14px;
  border-top: 1px solid var(--oc-border, #f0f0f0);
  cursor: pointer;
}

/* 添加船型弹窗 */
.h5-confirm-dialog {
  background: #fff;
  border-radius: var(--oc-radius-lg, 12px);
  padding: 20px;
  width: 100%;
  max-width: 300px;
}

.h5-confirm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--oc-title, #1a3a6e);
  margin-bottom: 16px;
  text-align: center;
}

.h5-confirm-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--oc-border, #e0e4e8);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  margin-bottom: 16px;
  background: var(--oc-bg-soft, #fafbfc);
}

.h5-confirm-btns {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.h5-btn-cancel,
.h5-btn-submit {
  padding: 8px 20px;
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
</style>
