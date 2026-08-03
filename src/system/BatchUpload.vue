<template>
  <div class="batch-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">批量上传排查记录</h2>
        <p class="page-subtitle">通过上传 Excel 文件批量导入故障排查记录，支持预览、编辑后一键提交</p>
      </div>
      <div class="header-actions">
        <button class="header-btn btn-add-ship" @click="addShipType">
          <svg class="header-btn-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          </svg>
          <span>新增船型</span>
        </button>
        <button class="header-btn btn-sample" @click="downloadSample" title="下载批量上传示例文件">
          <svg class="header-btn-icon" viewBox="0 0 1024 1024" width="16" height="16" aria-hidden="true">
            <path d="M505.7 661c8 8 18.8 12.3 29.7 12.3 10.9 0 21.7-4.1 29.7-12.3l261.9-261.9c16.4-16.4 16.4-43 0-59.4-16.4-16.4-43-16.4-59.4 0L568 475.6V128c0-23.2-18.8-42-42-42s-42 18.8-42 42v347.6L327.5 339.7c-16.4-16.4-43-16.4-59.4 0-16.4 16.4-16.4 43 0 59.4L505.7 661z"/>
            <path d="M896 768H128c-23.2 0-42 18.8-42 42s18.8 42 42 42h768c23.2 0 42-18.8 42-42s-18.8-42-42-42z"/>
          </svg>
          <span>下载示例文件</span>
        </button>
      </div>
    </div>

    <!-- 数据表格（仅有数据时展示） -->
    <div class="table-card" v-if="tableData.length > 0">
      <!-- 工具栏 -->
      <div class="table-toolbar">
        <span class="record-count">
          共 <strong>{{ tableData.length }}</strong> 条数据
          <span v-if="unmatchedCount > 0" class="unmatched-tip">
            （{{ unmatchedCount }} 条未匹配）
          </span>
        </span>
        <div class="toolbar-actions">
          <el-button @click="clearData" type="danger" plain size="small">
            清空数据
          </el-button>
          <el-button type="primary" @click="handleUpload" :loading="isUploading" size="small">
            {{ isUploading ? '上传中...' : '确认上传' }}
          </el-button>
        </div>
      </div>

      <!-- 可编辑表格 -->
      <el-table :data="pagedData" border class="batch-table" size="small" style="width: 100%">
        <el-table-column label="序号" type="index" width="55" align="center" fixed :index="(i) => (currentPage - 1) * pageSize + i + 1" />

        <!-- 船型 -->
        <el-table-column label="船型" width="160">
          <template #default="{ row }">
            <el-select
              v-model="row.shipId"
              :placeholder="row.shipName ? `未匹配: ${row.shipName}` : '选择船型'"
              filterable
              :class="{ 'select-error': !row.shipId }"
              size="small"
              style="width: 100%"
            >
              <el-option
                v-for="ship in shipList"
                :key="ship.id"
                :label="ship.name"
                :value="ship.id"
              />
            </el-select>
          </template>
        </el-table-column>

        <!-- 故障现象 -->
        <el-table-column label="故障现象" min-width="180">
          <template #default="{ row }">
            <el-input
              v-model="row.phenomenon"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="故障现象"
              size="small"
            />
          </template>
        </el-table-column>

        <!-- 排查步骤 -->
        <el-table-column label="排查步骤" min-width="220">
          <template #default="{ row }">
            <el-input
              v-model="row.shooting"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="排查步骤（多步骤用 ; 分隔）"
              size="small"
            />
          </template>
        </el-table-column>

        <!-- 照片 -->
        <el-table-column label="照片" width="190">
          <template #default="{ row, $index }">
            <div class="photo-cell">
              <div v-for="(photo, i) in row.photos" :key="i" class="photo-thumb">
                <img :src="photo.preview || photo.url" alt="照片" />
                <div v-if="photo.uploading" class="thumb-uploading">
                  <span class="loading-spinner"></span>
                </div>
                <span class="thumb-remove" @click="removePhoto(getRowIndex($index), i)">×</span>
              </div>
              <el-upload
                v-if="row.photos.length < 9"
                :show-file-list="false"
                :auto-upload="false"
                :on-change="(f) => handlePhotoChange(f, getRowIndex($index))"
                accept="image/*"
                multiple
                class="photo-add-upload"
              >
                <div class="add-btn photo-add-btn">+ 添加</div>
              </el-upload>
              <span v-else class="limit-tip">已达上限</span>
            </div>
          </template>
        </el-table-column>

        <!-- 文件 -->
        <el-table-column label="文件" width="170">
          <template #default="{ row, $index }">
            <div class="file-cell">
              <div v-for="(doc, i) in row.docs" :key="i" class="file-tag">
                <span class="file-tag-icon">📎</span>
                <span class="file-tag-name">文件{{ i + 1 }}</span>
                <span v-if="doc.uploading" class="file-uploading">
                  <span class="loading-spinner small"></span>
                </span>
                <span class="file-remove" @click="removeDoc(getRowIndex($index), i)">×</span>
              </div>
              <el-upload
                :show-file-list="false"
                :auto-upload="false"
                :on-change="(f) => handleDocChange(f, getRowIndex($index))"
                accept=".pdf,.doc,.docx"
                multiple
                class="file-add-upload"
              >
                <div class="add-btn file-add-btn">+ 添加</div>
              </el-upload>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="70" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" text size="small" @click="removeRow(getRowIndex($index))">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页条 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="tableData.length"
          layout="total, sizes, prev, pager, next"
          background
          small
        />
      </div>
    </div>

    <!-- Excel 拖拽上传区 -->
    <div class="upload-card">
      <el-upload
        drag
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleExcelChange"
        accept=".xlsx,.xls"
        class="excel-uploader"
        :disabled="isParsing"
      >
        <div class="uploader-content" :class="{ parsing: isParsing }">
          <div class="upload-icon">{{ isParsing ? '⏳' : '📊' }}</div>
          <div class="upload-text">
            {{ isParsing ? '正在解析...' : '将 Excel 文件拖到此处，或' }}<em v-if="!isParsing">点击上传</em>
          </div>
          <div class="upload-hint">仅支持 .xlsx / .xls 格式</div>
          <div class="upload-hint format-hint">
            列顺序：船型、故障现象、排查步骤、照片（表头第一行将跳过）
          </div>
        </div>
      </el-upload>
    </div>

    <!-- 新增船型弹窗 -->
    <el-dialog v-model="shipTypeDialogVisible" title="新增船型" width="400px" :close-on-click-modal="false" append-to-body>
      <el-form @submit.prevent="confirmAddShip">
        <el-form-item>
          <el-input
            v-model="newShipName"
            placeholder="请输入船型名称"
            maxlength="20"
            clearable
            @keyup.enter="confirmAddShip"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelAddShip">取消</el-button>
        <el-button type="primary" :loading="addShipSubmitting" @click="confirmAddShip">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量添加未匹配船型弹窗 -->
    <el-dialog
      v-model="unmatchedShipsDialogVisible"
      title="发现未匹配的船型"
      width="500px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="unmatched-ships-header">
        <p class="unmatched-ships-tip">
          Excel 中的以下船型在系统中不存在，是否批量添加到系统？
        </p>
        <el-checkbox
          :model-value="unmatchedShips.every(item => item.checked)"
          :indeterminate="unmatchedShips.some(item => item.checked) && !unmatchedShips.every(item => item.checked)"
          @change="toggleAllUnmatchedShips"
        >
          全选
        </el-checkbox>
      </div>
      <div class="unmatched-ships-list">
        <el-checkbox
          v-for="item in unmatchedShips"
          :key="item.name"
          v-model="item.checked"
          :label="item.name"
          class="unmatched-ship-item"
          :disabled="batchAddShipsSubmitting"
        />
      </div>
      <!-- 批量添加进度条 -->
      <div v-if="batchAddProgress >= 0" class="batch-progress-wrapper">
        <el-progress :percentage="batchAddProgress" :stroke-width="10" status="success" />
        <p class="batch-progress-text">正在添加船型，请稍候...（{{ batchAddProgress }}%）</p>
      </div>
      <template #footer>
        <el-button @click="unmatchedShipsDialogVisible = false" :disabled="batchAddShipsSubmitting">取消</el-button>
        <el-button
          type="primary"
          :loading="batchAddShipsSubmitting"
          @click="batchAddUnmatchedShips"
        >
          {{ batchAddShipsSubmitting ? '添加中...' : '批量添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { getPrivilege } from '@/utils/token'
import { deleteFiles } from '@/utils/file'
import { uploadFile as uploadQueuedFile } from '@/utils/uploadQueue'

export default {
  name: 'BatchUploadPage',
  data() {
    return {
      shipList: [],
      tableData: [],
      isParsing: false,
      isUploading: false,
      privilege: 1,
      currentPage: 1,
      pageSize: 10,
      shipTypeDialogVisible: false,
      newShipName: '',
      addShipSubmitting: false,
      unmatchedShipsDialogVisible: false,
      unmatchedShips: [],
      batchAddShipsSubmitting: false,
      batchAddProgress: -1
    }
  },
  computed: {
    unmatchedCount() {
      return this.tableData.filter(r => !r.shipId).length
    },
    pagedData() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.tableData.slice(start, start + this.pageSize)
    }
  },
  created() {
    this.privilege = getPrivilege()
    this.fetchShips()
  },
  methods: {
    // ====== 下载示例文件 ======
    downloadSample() {
      const url = 'http://user-bk.oss-cn-shanghai.aliyuncs.com/%E6%89%B9%E9%87%8F%E4%B8%8A%E4%BC%A0%E7%A4%BA%E4%BE%8B%E6%96%87%E4%BB%B6.xlsx'
      const a = document.createElement('a')
      a.href = url
      a.download = '批量上传示例文件.xlsx'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },

    // ====== 船型列表 ======
    fetchShips() {
      return request.get('/ships').then(res => {
        if (res.data.code === 1 && res.data.data) {
          this.shipList = res.data.data.map(item => ({ id: item.id, name: item.name }))
        }
      }).catch(() => {
        ElMessage.error('获取船型列表失败！')
      })
    },

    // ====== Excel 文件处理 ======
    async handleExcelChange(uploadFile) {
      if (uploadFile.status !== 'ready') return
      const file = uploadFile.raw
      if (!file) return

      // 校验文件类型
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        ElMessage.error('请上传 Excel 文件（.xlsx 或 .xls）！')
        return
      }

      // 已有数据时确认覆盖
      if (this.tableData.length > 0) {
        try {
          await ElMessageBox.confirm(
            '上传新文件将覆盖当前已解析的数据，是否继续？',
            '提示',
            { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
          )
        } catch {
          return
        }
      }

      this.isParsing = true
      try {
        const { rows, imagesByRow } = await this.parseExcel(file)

        if (rows.length === 0) {
          ElMessage.warning('未解析到有效数据，请检查 Excel 文件内容！')
          this.isParsing = false
          return
        }

        // 构建表格数据
        this.tableData = rows.map((row, i) => {
          const shipName = String(row[0] || '').trim()
          const phenomenon = String(row[1] || '').trim()
          const shooting = String(row[2] || '').trim()
          // 不区分大小写匹配船型
          const matchedShip = this.shipList.find(s => s.name.toLowerCase() === shipName.toLowerCase())

          // 提取该行对应的内嵌图片（drawing 行号从 0 开始，跳过表头后数据行 = drawingRow - 1）
          const rowImages = imagesByRow[i + 1] || []
          const photos = rowImages.map(item => ({
            url: '',
            preview: URL.createObjectURL(item.blob),
            uploading: true,
            _blob: item.blob,
            _fileName: item.fileName
          }))

          return {
            shipId: matchedShip ? matchedShip.id : '',
            shipName,
            phenomenon,
            shooting,
            photos,
            docs: []
          }
        })

        // 重置到第一页
        this.currentPage = 1
        // 上传从 Excel 提取的内嵌图片到服务端获取 OSS 链接
        this.uploadExtractedPhotos()

        // 收集未匹配的船型名称（去重，过滤空名称）
        const unmatchedShipNames = [...new Set(
          this.tableData.filter(r => !r.shipId && r.shipName).map(r => r.shipName)
        )]
        if (unmatchedShipNames.length > 0) {
          // 弹窗询问是否批量添加未匹配的船型
          this.showUnmatchedShipsDialog(unmatchedShipNames)
        } else {
          ElMessage.success(`成功解析 ${this.tableData.length} 条数据！`)
        }
      } catch (err) {
        console.error('Excel 解析失败:', err)
        ElMessage.error('Excel 文件解析失败！')
      }
      this.isParsing = false
    },

    // 解析 Excel：xlsx 解析文本 + jszip 提取内嵌图片
    async parseExcel(file) {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      // 转为二维数组，跳过表头第一行，空单元格填 ''
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1, defval: '' })
      // 过滤完全空行
      const filteredRows = rows.filter(row =>
        row.some(cell => String(cell || '').trim() !== '')
      )

      // 提取内嵌图片
      const imagesByRow = await this.extractImages(file)

      return { rows: filteredRows, imagesByRow }
    },

    // 用 JSZip 从 xlsx 中提取内嵌图片，按行号分组
    async extractImages(file) {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(file)
      const imagesByRow = {} // { drawingRowNum(0-based): [blob, ...] }

      // 查找所有 drawing 文件
      const drawingPaths = Object.keys(zip.files).filter(p =>
        /xl\/drawings\/drawing\d+\.xml$/.test(p)
      )

      for (const drawingPath of drawingPaths) {
        const drawingXml = await zip.file(drawingPath).async('string')
        const doc = new DOMParser().parseFromString(drawingXml, 'text/xml')

        // 构建 rId -> 媒体文件路径 映射
        const relsPath = drawingPath
          .replace('xl/drawings/', 'xl/drawings/_rels/') + '.rels'
        const relsMap = {}
        const relsFile = zip.file(relsPath)
        if (relsFile) {
          const relsXml = await relsFile.async('string')
          const relsDoc = new DOMParser().parseFromString(relsXml, 'text/xml')
          const relationships = relsDoc.getElementsByTagName('Relationship')
          for (let i = 0; i < relationships.length; i++) {
            relsMap[relationships[i].getAttribute('Id')] =
              relationships[i].getAttribute('Target')
          }
        }

        // 解析所有锚点元素
        const anchorTypes = ['twoCellAnchor', 'oneCellAnchor', 'absoluteAnchor']
        const anchors = []
        for (const type of anchorTypes) {
          const elements = doc.getElementsByTagNameNS('*', type)
          for (let i = 0; i < elements.length; i++) {
            anchors.push(elements[i])
          }
        }

        const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

        for (const anchor of anchors) {
          // 获取 from 元素中的行号
          const fromEl = anchor.getElementsByTagNameNS('*', 'from')[0]
          if (!fromEl) continue
          const rowEl = fromEl.getElementsByTagNameNS('*', 'row')[0]
          if (!rowEl) continue
          const rowNum = parseInt(rowEl.textContent)
          if (isNaN(rowNum)) continue

          // 获取 blip 中的 embed 引用
          const blipEl = anchor.getElementsByTagNameNS('*', 'blip')[0]
          if (!blipEl) continue
          const embed = blipEl.getAttributeNS(NS_REL, 'embed')
          if (!embed || !relsMap[embed]) continue

          // 解析媒体文件路径并提取
          const mediaPath = this.resolvePath(drawingPath, relsMap[embed])
          const mediaFile = zip.file(mediaPath)
          if (!mediaFile) continue

          const blob = await mediaFile.async('blob')
          const fileName = mediaPath.split('/').pop() || 'image.png'
          if (!imagesByRow[rowNum]) imagesByRow[rowNum] = []
          imagesByRow[rowNum].push({ blob, fileName })
        }
      }

      return imagesByRow
    },

    // 解析 zip 内相对路径为绝对路径
    resolvePath(base, relative) {
      if (relative.startsWith('/')) return relative.substring(1)
      const baseParts = base.split('/')
      baseParts.pop()
      const relParts = relative.split('/')
      for (const part of relParts) {
        if (part === '..') {
          baseParts.pop()
        } else if (part !== '.' && part !== '') {
          baseParts.push(part)
        }
      }
      return baseParts.join('/')
    },

    // 上传从 Excel 提取的内嵌图片到服务端
    // 节流由 @/utils/uploadQueue 全局队列统一管理，无需额外延时
    async uploadExtractedPhotos() {
      // 收集所有需要上传的照片
      const uploadTasks = []
      this.tableData.forEach((row, rowIndex) => {
        row.photos.forEach((photo, photoIndex) => {
          if (!photo._blob) return
          uploadTasks.push({ rowIndex, photoIndex, photo })
        })
      })

      if (uploadTasks.length === 0) return

      // 串行执行，节流由 uploadSingleFile 内部队列保证
      for (const { rowIndex, photoIndex, photo } of uploadTasks) {
        // 构造带正确扩展名的 File 对象，避免后端取扩展名失败
        const fileName = photo._fileName || 'image.png'
        const mimeType = this.getMimeType(fileName)
        const file = new File([photo._blob], fileName, { type: mimeType })

        try {
          const ossUrl = await this.uploadSingleFile(file)
          this.tableData[rowIndex].photos[photoIndex].url = ossUrl
          this.tableData[rowIndex].photos[photoIndex].uploading = false
        } catch (err) {
          ElMessage.error(`第 ${rowIndex + 1} 行照片上传失败！`)
          this.tableData[rowIndex].photos[photoIndex].uploading = false
        }
      }
    },

    // 根据文件名推断 MIME 类型
    getMimeType(fileName) {
      const ext = (fileName.split('.').pop() || '').toLowerCase()
      const types = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        bmp: 'image/bmp',
        webp: 'image/webp',
        tif: 'image/tiff',
        tiff: 'image/tiff'
      }
      return types[ext] || 'image/png'
    },

    // ====== 文件上传到服务端（获取 OSS 链接） ======
    // 节流逻辑统一由 @/utils/uploadQueue 管理，保证全局所有上传请求串行 + 200ms 间隔
    uploadSingleFile(file) {
      return uploadQueuedFile(file)
    },

    // ====== 表格内照片添加 ======
    handlePhotoChange(uploadFile, rowIndex) {
      if (uploadFile.status !== 'ready') return
      const file = uploadFile.raw
      if (!file) return

      // 校验大小
      if (file.size > 2 * 1024 * 1024) {
        ElMessage.warning('单个文件大小不能超过2MB！')
        return
      }
      // 校验数量
      if (this.tableData[rowIndex].photos.length >= 9) {
        ElMessage.warning('最多照片数量不能超过9张！')
        return
      }

      const preview = URL.createObjectURL(file)
      const photoObj = { url: '', preview, uploading: true }
      this.tableData[rowIndex].photos.push(photoObj)
      const photoIndex = this.tableData[rowIndex].photos.length - 1

      this.uploadSingleFile(file).then(ossUrl => {
        this.tableData[rowIndex].photos[photoIndex].url = ossUrl
        this.tableData[rowIndex].photos[photoIndex].uploading = false
      }).catch(() => {
        ElMessage.error('照片上传失败！')
        // 释放预览 URL，避免内存泄漏
        if (photoObj.preview) URL.revokeObjectURL(photoObj.preview)
        this.tableData[rowIndex].photos.splice(photoIndex, 1)
      })
    },

    // ====== 表格内文件添加 ======
    handleDocChange(uploadFile, rowIndex) {
      if (uploadFile.status !== 'ready') return
      const file = uploadFile.raw
      if (!file) return

      // 校验大小
      if (file.size > 2 * 1024 * 1024) {
        ElMessage.warning('单个文件大小不能超过2MB！')
        return
      }

      const docObj = { url: '', name: file.name, uploading: true }
      this.tableData[rowIndex].docs.push(docObj)
      const docIndex = this.tableData[rowIndex].docs.length - 1

      this.uploadSingleFile(file).then(ossUrl => {
        this.tableData[rowIndex].docs[docIndex].url = ossUrl
        this.tableData[rowIndex].docs[docIndex].uploading = false
      }).catch(() => {
        ElMessage.error('文件上传失败！')
        this.tableData[rowIndex].docs.splice(docIndex, 1)
      })
    },

    // ====== 删除操作 ======
    removePhoto(rowIndex, photoIndex) {
      const photo = this.tableData[rowIndex]?.photos[photoIndex]
      if (photo) {
        // 释放预览 URL，避免内存泄漏
        if (photo.preview) URL.revokeObjectURL(photo.preview)
        if (photo.url) deleteFiles(photo.url)
      }
      this.tableData[rowIndex].photos.splice(photoIndex, 1)
    },

    removeDoc(rowIndex, docIndex) {
      const doc = this.tableData[rowIndex]?.docs[docIndex]
      if (doc && doc.url) deleteFiles(doc.url)
      this.tableData[rowIndex].docs.splice(docIndex, 1)
    },

    // 页内索引转全局索引
    getRowIndex(pageIndex) {
      return (this.currentPage - 1) * this.pageSize + pageIndex
    },

    removeRow(rowIndex) {
      const row = this.tableData[rowIndex]
      if (!row) return

      const hasFiles = (row.photos.length > 0) || (row.docs.length > 0)

      const doRemove = () => {
        // 删除该行所有已上传的源文件
        const urls = [
          ...row.photos.filter(p => p.url).map(p => p.url),
          ...row.docs.filter(d => d.url).map(d => d.url)
        ]
        if (urls.length > 0) deleteFiles(urls)
        // 释放该行所有照片的预览 URL，避免内存泄漏
        row.photos.forEach(p => {
          if (p.preview) URL.revokeObjectURL(p.preview)
        })
        this.tableData.splice(rowIndex, 1)
        // 删除后若当前页无数据则回退一页
        const totalPages = Math.ceil(this.tableData.length / this.pageSize)
        if (this.currentPage > totalPages && totalPages > 0) {
          this.currentPage = totalPages
        }
      }

      // 有照片/文件时二次确认，避免误删
      if (hasFiles) {
        ElMessageBox.confirm(
          `确定删除第 ${rowIndex + 1} 行吗？该行已上传的照片/文件将被同步删除，且不可恢复。`,
          '删除确认',
          { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
        ).then(() => {
          doRemove()
        }).catch(() => {})
      } else {
        doRemove()
      }
    },

    clearData() {
      ElMessageBox.confirm('确定清空所有已解析的数据吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 释放所有照片的预览 URL，避免内存泄漏
        this.tableData.forEach(row => {
          row.photos.forEach(p => {
            if (p.preview) URL.revokeObjectURL(p.preview)
          })
        })
        // 清空前删除所有已上传的源文件
        const urls = []
        this.tableData.forEach(row => {
          row.photos.forEach(p => { if (p.url) urls.push(p.url) })
          row.docs.forEach(d => { if (d.url) urls.push(d.url) })
        })
        if (urls.length > 0) deleteFiles(urls)
        this.tableData = []
        this.currentPage = 1
        ElMessage.success('数据已清空！')
      }).catch(() => {})
    },

    // ====== 构建提交数据模型（与 AddRecord 格式一致） ======
    buildSubmitData() {
      return this.tableData.map(row => ({
        shipId: row.shipId,
        phenomenon: row.phenomenon,
        shooting: row.shooting,
        photo: row.photos.filter(p => p.url).map(p => p.url),
        doc: row.docs.filter(d => d.url).map(d => d.url)
      }))
    },

    // ====== 确认上传 ======
    handleUpload() {
      // 校验数据
      for (let i = 0; i < this.tableData.length; i++) {
        const row = this.tableData[i]
        if (!row.shipId) {
          ElMessage.warning(`第 ${i + 1} 行未选择船型！`)
          return
        }
        if (!row.phenomenon.trim()) {
          ElMessage.warning(`第 ${i + 1} 行故障现象不能为空！`)
          return
        }
        if (!row.shooting.trim()) {
          ElMessage.warning(`第 ${i + 1} 行排查步骤不能为空！`)
          return
        }
        if (row.photos.some(p => p.uploading) || row.docs.some(d => d.uploading)) {
          ElMessage.warning(`第 ${i + 1} 行有文件正在上传中，请稍候！`)
          return
        }
      }

      const submitData = this.buildSubmitData()
      this.isUploading = true
      request.post('/trbsts/batch', submitData).then(res => {
        if (res.data.code === 1) {
          ElMessage.success(`成功上传 ${submitData.length} 条排查记录！`)
          // 释放所有照片的预览 URL，避免内存泄漏
          this.tableData.forEach(row => {
            row.photos.forEach(p => {
              if (p.preview) URL.revokeObjectURL(p.preview)
            })
          })
          // 提交成功后清空表格，避免重复提交
          this.tableData = []
          this.currentPage = 1
        } else {
          ElMessage.error(res.data.msg || '批量上传失败！')
        }
      }).catch(() => {
        ElMessage.error('批量上传失败！')
      }).finally(() => {
        this.isUploading = false
      })
    },
    // ====== 新增船型 ======
    addShipType() {
      this.shipTypeDialogVisible = true
    },
    cancelAddShip() {
      this.shipTypeDialogVisible = false
      this.newShipName = ''
    },
    confirmAddShip() {
      const name = this.newShipName.trim()
      if (!name) {
        ElMessage.warning('请输入船型名称！')
        return
      }
      this.addShipSubmitting = true
      request.put('/ships', { name }).then(res => {
        if (res.data.code === 1) {
          ElMessage.success('添加船型成功！')
          this.shipTypeDialogVisible = false
          this.newShipName = ''
          this.fetchShips()
        } else {
          ElMessage.error(res.data.msg || '添加船型失败！')
        }
      }).catch(() => {
        ElMessage.error('添加船型失败，请重试！')
      }).finally(() => {
        this.addShipSubmitting = false
      })
    },

    // ====== 批量添加未匹配船型 ======
    showUnmatchedShipsDialog(shipNames) {
      this.unmatchedShips = shipNames.map(name => ({ name, checked: true }))
      this.unmatchedShipsDialogVisible = true
    },
    toggleAllUnmatchedShips(checked) {
      this.unmatchedShips.forEach(item => {
        item.checked = checked
      })
    },
    // 延时函数（用于请求节流）
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },
    async batchAddUnmatchedShips() {
      const selectedShips = this.unmatchedShips.filter(item => item.checked)
      if (selectedShips.length === 0) {
        ElMessage.warning('请至少选择一个船型！')
        return
      }

      this.batchAddShipsSubmitting = true
      this.batchAddProgress = 0
      let successCount = 0
      let failCount = 0
      const totalCount = selectedShips.length
      const delay = 200 // 每次请求间隔 200ms，确保每秒不超过5次

      // 逐个添加船型（串行执行 + 节流，避免触发后端速率限制）
      for (let i = 0; i < selectedShips.length; i++) {
        const item = selectedShips[i]
        try {
          const res = await request.put('/ships', { name: item.name })
          if (res.data.code === 1) {
            successCount++
          } else {
            failCount++
          }
        } catch (err) {
          failCount++
        }

        // 更新进度
        this.batchAddProgress = Math.round(((i + 1) / totalCount) * 100)

        // 请求节流：如果不是最后一个，等待 200ms
        if (i < selectedShips.length - 1) {
          await this.sleep(delay)
        }
      }

      this.batchAddShipsSubmitting = false
      this.batchAddProgress = -1

      // 显示结果
      if (successCount > 0 && failCount === 0) {
        ElMessage.success(`成功添加 ${successCount} 个船型！`)
      } else if (successCount > 0 && failCount > 0) {
        ElMessage.warning(`成功添加 ${successCount} 个船型，失败 ${failCount} 个`)
      } else if (failCount > 0) {
        ElMessage.error('批量添加船型失败！')
        return
      }

      // 关闭弹窗
      this.unmatchedShipsDialogVisible = false
      this.unmatchedShips = []

      // 刷新船型列表并重新匹配表格
      await this.fetchShips()
      this.rematchTableShips()
    },
    rematchTableShips() {
      // 重新匹配表格中的船型（不区分大小写）
      this.tableData.forEach(row => {
        if (!row.shipId && row.shipName) {
          const matchedShip = this.shipList.find(s => s.name.toLowerCase() === row.shipName.toLowerCase())
          if (matchedShip) {
            row.shipId = matchedShip.id
          }
        }
      })

      // 检查是否还有未匹配的船型
      const unmatched = this.tableData.filter(r => !r.shipId).length
      if (unmatched > 0) {
        ElMessage.info(`还有 ${unmatched} 条记录船型未匹配，请手动选择！`)
      }
    },
  }
}
</script>

<style scoped>
.batch-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.header-left {
  flex: 1;
  min-width: 0;
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

/* 头部操作按钮组 */
.header-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.header-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-btn-icon {
  flex-shrink: 0;
}

/* 新增船型按钮（主操作-实心渐变） */
.btn-add-ship {
  border: none;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  color: #fff;
  box-shadow: 0 2px 8px rgba(53, 132, 228, 0.3);
}

.btn-add-ship:hover {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
  box-shadow: 0 4px 14px rgba(53, 132, 228, 0.45);
  transform: translateY(-1px);
}

.btn-add-ship:active {
  transform: translateY(0);
}

/* 下载示例文件按钮（次操作-描边） */
.btn-sample {
  border: 1px solid #3584e4;
  background: #f0f7ff;
  color: #1a5fb4;
  box-shadow: 0 2px 6px rgba(53, 132, 228, 0.12);
}

.btn-sample:hover {
  background: #3584e4;
  color: #fff;
  box-shadow: 0 4px 12px rgba(53, 132, 228, 0.3);
}

.btn-sample:active {
  transform: translateY(1px);
}

/* Excel 上传区 */
.upload-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.excel-uploader {
  width: 100%;
}

.excel-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: #d0d5dd;
  border-radius: 10px;
  background: #fafbfc;
  transition: all 0.3s;
  padding: 0 20px;
}

.excel-uploader :deep(.el-upload-dragger:hover) {
  border-color: #3584e4;
  background: #f0f7ff;
}

.excel-uploader :deep(.el-upload-dragger.is-dragover) {
  border-color: #3584e4;
  background: #e8f4ff;
}

.uploader-content {
  text-align: center;
  width: 100%;
}

.uploader-content.parsing {
  opacity: 0.6;
  pointer-events: none;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 15px;
  color: #1a3a6e;
  margin-bottom: 4px;
}

.upload-text em {
  color: #3584e4;
  font-style: normal;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.format-hint {
  margin-top: 4px;
  color: #b0b0b0;
}

/* 表格卡片 */
.table-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.record-count {
  font-size: 14px;
  color: #1a3a6e;
}

.record-count strong {
  color: #3584e4;
  font-size: 16px;
}

.unmatched-tip {
  color: #ff9900;
  font-size: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

/* 表格样式 */
.batch-table :deep(.el-table__header th) {
  background: #f0f5ff;
  color: #1a3a6e;
  font-weight: 600;
  font-size: 13px;
}

.batch-table :deep(.el-table__body .el-input__wrapper),
.batch-table :deep(.el-table__body .el-textarea__inner) {
  background: #fafbfc;
  border-radius: 4px;
}

.batch-table :deep(.el-table__body .el-input__wrapper.is-focus),
.batch-table :deep(.el-table__body .el-textarea__inner:focus) {
  background: #fff;
}

.select-error :deep(.el-select__wrapper) {
  box-shadow: 0 0 0 1px #ed4014 inset;
}

/* 照片单元格 */
.photo-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 4px 0;
}

.photo-thumb {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8ecf0;
  flex-shrink: 0;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-uploading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* loading 旋转图标 */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner.small {
  width: 12px;
  height: 12px;
  border-width: 1.5px;
  border-color: rgba(255, 144, 0, 0.3);
  border-top-color: #ff9900;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.thumb-remove {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 16px;
  height: 16px;
  background: rgba(237, 64, 20, 0.9);
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
}

.thumb-remove:hover {
  background: rgba(237, 64, 20, 1);
}

.photo-add-upload :deep(.el-upload) {
  display: block;
}

.photo-add-btn {
  width: 50px;
  height: 50px;
}

.limit-tip {
  font-size: 11px;
  color: #ccc;
}

/* 添加按钮 */
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #3584e4;
  cursor: pointer;
  transition: all 0.2s;
  background: #f0f7ff;
  border: 1px dashed #3584e4;
  border-radius: 6px;
  gap: 2px;
}

.add-btn:hover {
  background: #e8f4ff;
  border-color: #1a5fb4;
  color: #1a5fb4;
}

/* 文件单元格 */
.file-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.file-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #f0f5ff;
  border: 1px solid #d0dff0;
  border-radius: 4px;
  font-size: 12px;
  color: #1a5fb4;
  width: fit-content;
}

.file-tag-icon {
  font-size: 14px;
}

.file-uploading {
  color: #ff9900;
  font-size: 11px;
}

.file-remove {
  cursor: pointer;
  color: #ed4014;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
  margin-left: 2px;
}

.file-add-upload :deep(.el-upload) {
  display: inline-block;
}

.file-add-btn {
  width: auto;
  height: 28px;
  padding: 0 12px;
}

/* 分页条 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* 未匹配船型弹窗 */
.unmatched-ships-header {
  margin-bottom: 16px;
}

.unmatched-ships-tip {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.unmatched-ships-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.unmatched-ship-item {
  display: flex;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  transition: all 0.2s;
}

.unmatched-ship-item:last-child {
  margin-bottom: 0;
}

.unmatched-ship-item:hover {
  background: #f0f7ff;
}

/* 批量添加进度条 */
.batch-progress-wrapper {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f0f7ff;
  border-radius: 6px;
}

.batch-progress-text {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: #1a5fb4;
  text-align: center;
}
</style>
