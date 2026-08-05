<template>
  <div class="h5-add-page">
    <!-- 1 船型选择 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span class="h5-section-num">1</span>
        <span>船型选择</span>
        <span class="h5-required">*</span>
      </div>
      <div class="h5-select-box" @click="showShipPicker = true">
        <span :class="{ placeholder: !selectedShipName }">{{ selectedShipName || '请选择船型' }}</span>
        <span class="h5-arrow">&#9654;</span>
      </div>
    </div>

    <!-- 2 故障现象 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span class="h5-section-num">2</span>
        <span>故障现象</span>
        <span class="h5-required">*</span>
      </div>
      <textarea v-model="phenomenon" class="h5-textarea" placeholder="请描述故障现象"></textarea>
    </div>

    <!-- 3 排查步骤 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span class="h5-section-num">3</span>
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

    <!-- 4 照片上传 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span class="h5-section-num">4</span>
        <span>照片上传</span>
        <span class="h5-hint">最多 9 张，单张 &lt; 2M</span>
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

    <!-- 5 文件上传 -->
    <div class="h5-form-card">
      <div class="h5-form-title">
        <span class="h5-section-num">5</span>
        <span>文件上传</span>
        <span class="h5-hint">PDF / DOC / DOCX，单个 &lt; 2M</span>
      </div>
      <div class="h5-file-list" v-if="fileList.length > 0">
        <div v-for="(file, i) in fileList" :key="i" class="h5-file-item">
          <span class="h5-file-name">{{ file.uploading ? '⏳' : '📄' }} {{ file.name }}</span>
          <button class="h5-file-del" @click="removeFile(i, 'file')">×</button>
        </div>
      </div>
      <label class="h5-upload-add h5-upload-add-file">
        <span>+ 选择文件</span>
        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple @change="chooseFile($event)" hidden />
      </label>
    </div>

    <!-- 底部固定通栏提交按钮 -->
    <div class="h5-submit-bar">
      <p class="h5-submit-tip" v-if="privilege < 2">当前账号无上传权限</p>
      <button class="h5-submit-btn" :disabled="privilege < 2" @click="handleSubmit">提交记录</button>
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
  padding-bottom: 84px;
}

/* 表单卡片 */
.h5-form-card {
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: var(--oc-shadow-sm);
}

.h5-form-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--oc-gray-900);
}

/* 编号方块：浅蓝底 + 品牌蓝字 */
.h5-section-num {
  width: 26px;
  height: 26px;
  border-radius: var(--oc-radius);
  background: var(--oc-blue-50);
  color: var(--oc-blue-600);
  font-size: var(--oc-text-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.h5-required {
  margin-left: auto;
  color: var(--oc-danger);
  font-weight: 600;
}

.h5-hint {
  margin-left: auto;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
  font-weight: 400;
}

/* 船型选择 */
.h5-select-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 12px;
  border: 1px solid var(--oc-gray-200);
  border-radius: var(--oc-radius);
  background: var(--oc-bg-white);
  font-size: 15px;
  color: var(--oc-gray-900);
}

.h5-select-box .placeholder {
  color: var(--oc-gray-400);
}

.h5-arrow {
  color: var(--oc-gray-400);
  font-size: 10px;
  transform: rotate(90deg);
}

.h5-textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid var(--oc-gray-200);
  border-radius: var(--oc-radius);
  font-size: var(--oc-text-md);
  box-sizing: border-box;
  resize: vertical;
  outline: none;
  font-family: inherit;
  background: var(--oc-bg-white);
  color: var(--oc-gray-900);
}

.h5-textarea:focus {
  border-color: var(--oc-blue-600);
}

/* 排查步骤 */
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

/* 步骤序号：浅蓝底 + 蓝色描边圆环（规范 9.5） */
.h5-step-index {
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
}

.h5-step-input {
  flex: 1;
  height: 38px;
  border: 1px solid var(--oc-gray-200);
  border-radius: var(--oc-radius);
  padding: 0 10px;
  font-size: var(--oc-text-md);
  outline: none;
  box-sizing: border-box;
  background: var(--oc-bg-white);
  color: var(--oc-gray-900);
}

.h5-step-input:focus {
  border-color: var(--oc-blue-600);
}

.h5-step-del {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--oc-gray-400);
  cursor: pointer;
  padding: 0 4px;
}

.h5-step-del:active {
  color: var(--oc-danger);
}

/* 添加一步：整宽虚线按钮 */
.h5-add-step-btn {
  width: 100%;
  padding: 9px 0;
  font-size: var(--oc-text-sm);
  color: var(--oc-blue-600);
  background: none;
  border: 1px dashed var(--oc-gray-300);
  border-radius: var(--oc-radius);
  cursor: pointer;
}

.h5-add-step-btn:active {
  background: var(--oc-blue-50);
  border-color: var(--oc-blue-400);
}

/* 照片上传 */
.h5-upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.h5-upload-item {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: var(--oc-radius);
  overflow: hidden;
  border: 1px solid var(--oc-border-light);
}

.h5-upload-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h5-upload-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
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
  background: rgba(15, 23, 42, 0.5);
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
  border: 1px dashed var(--oc-gray-300);
  border-radius: var(--oc-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--oc-gray-400);
  background: var(--oc-gray-50);
  cursor: pointer;
}

.h5-upload-add:active {
  background: var(--oc-blue-50);
  border-color: var(--oc-blue-400);
  color: var(--oc-blue-600);
}

.h5-upload-add-file {
  width: 100%;
  height: 42px;
  font-size: var(--oc-text-md);
}

/* 文件列表 */
.h5-file-list {
  margin-bottom: 8px;
}

.h5-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--oc-gray-50);
  border: 1px solid var(--oc-border-light);
  border-radius: var(--oc-radius);
  margin-bottom: 8px;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-700);
}

.h5-file-item:last-child {
  margin-bottom: 0;
}

.h5-file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.h5-file-del {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--oc-gray-400);
  cursor: pointer;
  padding: 0 2px;
  flex-shrink: 0;
}

.h5-file-del:active {
  color: var(--oc-danger);
}

/* 底部固定通栏提交按钮（位于 TabBar 上方） */
.h5-submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(56px + env(safe-area-inset-bottom));
  padding: 10px 12px;
  background: var(--oc-bg-white);
  border-top: 1px solid var(--oc-gray-200);
  box-shadow: 0 -2px 10px rgba(15, 23, 42, 0.04);
  z-index: 90;
}

.h5-submit-tip {
  margin: 0 0 6px;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
  text-align: center;
}

.h5-submit-btn {
  width: 100%;
  padding: 11px 0;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--oc-blue-600);
  border: none;
  border-radius: var(--oc-radius);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.h5-submit-btn:active:not(:disabled) {
  background: var(--oc-blue-700);
}

.h5-submit-btn:disabled {
  background: var(--oc-gray-300);
  cursor: not-allowed;
}

/* 弹窗 */
.h5-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
  box-sizing: border-box;
}

/* 船型底部弹出式选择器 */
.h5-picker-dialog {
  background: var(--oc-bg-white);
  border-radius: var(--oc-radius-lg) var(--oc-radius-lg) 0 0;
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
  background: var(--oc-bg-white);
  color: var(--oc-gray-900);
  border-bottom: 1px solid var(--oc-border-light);
}

.h5-picker-header span {
  font-size: var(--oc-text-lg);
  font-weight: 600;
}

.h5-picker-close {
  background: none;
  border: none;
  color: var(--oc-gray-400);
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
  color: var(--oc-gray-700);
  border-bottom: 1px solid var(--oc-border-light);
  cursor: pointer;
}

.h5-picker-item:active {
  background: var(--oc-gray-50);
}

.h5-picker-item.active {
  color: var(--oc-blue-700);
  background: var(--oc-blue-50);
  font-weight: 600;
}

.h5-picker-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px;
  color: var(--oc-blue-600);
  font-size: var(--oc-text-md);
  font-weight: 500;
  border-top: 1px solid var(--oc-border-light);
  cursor: pointer;
}

/* 添加船型弹窗 */
.h5-confirm-dialog {
  background: var(--oc-bg-white);
  border-radius: var(--oc-radius-lg);
  padding: 20px;
  width: 100%;
  max-width: 300px;
}

.h5-confirm-title {
  font-size: var(--oc-text-lg);
  font-weight: 600;
  color: var(--oc-gray-900);
  margin-bottom: 16px;
  text-align: center;
}

.h5-confirm-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--oc-gray-200);
  border-radius: var(--oc-radius);
  padding: 0 12px;
  font-size: var(--oc-text-md);
  box-sizing: border-box;
  outline: none;
  margin-bottom: 16px;
  background: var(--oc-bg-white);
  color: var(--oc-gray-900);
}

.h5-confirm-input:focus {
  border-color: var(--oc-blue-600);
}

.h5-confirm-btns {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.h5-btn-cancel,
.h5-btn-submit {
  padding: 8px 20px;
  font-size: var(--oc-text-md);
  font-weight: 500;
  border-radius: var(--oc-radius);
  cursor: pointer;
}

.h5-btn-cancel {
  color: var(--oc-gray-700);
  background: var(--oc-bg-white);
  border: 1px solid var(--oc-gray-200);
}

.h5-btn-submit {
  color: #fff;
  background: var(--oc-blue-600);
  border: none;
}
</style>
