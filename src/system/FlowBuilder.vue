<template>
  <div class="flow-builder">
    <!-- 顶部工具栏 -->
    <div class="fb-toolbar">
      <div class="ship-select-wrap">
        <el-select
          v-model="meta.shipId"
          placeholder="关联船型（必选）"
          size="default"
          style="width: 180px"
          @change="handleShipChange"
        >
          <el-option
            v-for="s in shipList"
            :key="s.shipId"
            :label="s.name"
            :value="s.shipId"
          />
        </el-select>
      </div>
      <div class="record-select-wrap">
        <el-select
          v-model="meta.bindTrbstId"
          :placeholder="meta.shipId ? '排查记录（必选）' : '请先选择船型'"
          :disabled="!meta.shipId || loadingRecords || loadingFlow"
          :loading="loadingRecords || loadingFlow"
          size="default"
          style="width: 280px"
          clearable
          filterable
          @change="handleRecordChange"
        >
          <el-option
            v-for="r in recordList"
            :key="r.id"
            :label="r.phenomenon"
            :value="r.id"
          />
        </el-select>
      </div>
      <div class="toolbar-spacer"></div>
      <!-- 文件组 -->
      <div class="toolbar-group">
        <el-button :icon="Plus" @click="handleNew">新建</el-button>
        <el-button :icon="Upload" @click="triggerImport">导入</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
      </div>
      <span class="toolbar-divider"></span>
      <!-- 视图与校验组（全屏按钮已移入画布右上角浮动，避免窄屏挤压提交按钮） -->
      <div class="toolbar-group">
        <el-button :icon="Aim" @click="handleValidate">校验</el-button>
        <el-button :icon="View" @click="handlePreview">预览</el-button>
      </div>
      <span class="toolbar-divider"></span>
      <!-- 提交组 -->
      <div class="toolbar-group">
        <el-button
          type="primary"
          :icon="Promotion"
          :loading="submitting"
          title="上传流程文件并绑定到所选故障排查记录"
          @click="handleSubmit"
        >提交</el-button>
      </div>
      <input
        ref="importInput"
        type="file"
        accept=".json,application/json"
        style="display: none"
        @change="handleImportFile"
      />
    </div>

    <div class="fb-main" :class="{ 'is-fullscreen': canvasFullscreen }">
      <!-- 全屏时浮动退出按钮（定位在画布右上角，避开右侧属性面板，不遮挡删除节点按钮） -->
      <el-button
        v-if="canvasFullscreen"
        class="fb-exit-fullscreen"
        :icon="FullScreen"
        title="退出全屏 (Esc)"
        @click="toggleFullscreen"
      >退出全屏</el-button>
      <!-- 左侧组件面板 -->
      <div class="fb-palette">
        <p class="palette-title">组件面板</p>
        <div
          v-for="item in paletteItems"
          :key="item.type"
          class="palette-item"
          :class="['palette-' + item.type, { disabled: item.type === 'start' }]"
          :draggable="item.type !== 'start'"
          @dragstart="onDragStart($event, item.type)"
        >
          <span class="palette-dot"></span>
          <span>{{ item.label }}</span>
        </div>
        <p class="palette-hint">拖拽组件到画布创建节点，从锚点拖出连线建立跳转。</p>
        <p class="palette-hint">选中节点/连线后按 Delete 键删除。</p>
      </div>

      <!-- 中央画布 -->
      <div class="fb-canvas" @drop="onDrop" @dragover.prevent @dragenter.prevent>
        <!-- 非全屏时浮动全屏按钮（画布右上角，与全屏退出按钮同款） -->
        <el-button
          v-if="!canvasFullscreen"
          class="fb-enter-fullscreen"
          :icon="FullScreen"
          title="全屏编辑"
          @click="toggleFullscreen"
        >全屏</el-button>
        <VueFlow
          v-model:nodes="vfNodes"
          v-model:edges="vfEdges"
          class="vue-flow-canvas"
          :delete-key-code="'Delete'"
          :default-viewport="{ zoom: 1 }"
          :min-zoom="0.2"
          :max-zoom="2.5"
          fit-view-on-init
        >
          <Background pattern-color="#E2E8F0" :gap="20" :size="1" />
          <Controls position="bottom-left" />
          <template #node-flow="nodeProps">
            <FlowNode v-bind="nodeProps" />
          </template>
        </VueFlow>
        <!-- 未选船型/排查记录时蒙层阻止交互 -->
        <div v-if="!canvasReady" class="fb-canvas-mask">
          <div class="fb-canvas-placeholder">
            <div class="placeholder-illustration">
              <svg viewBox="0 0 120 90" fill="none">
                <rect x="8" y="34" width="32" height="22" rx="6" fill="#fff" stroke="#CBD5E1" stroke-width="2"/>
                <rect x="78" y="10" width="34" height="22" rx="6" fill="#fff" stroke="#93C5FD" stroke-width="2"/>
                <rect x="78" y="58" width="34" height="22" rx="6" fill="#fff" stroke="#CBD5E1" stroke-width="2"/>
                <path d="M40 45 C 58 45, 60 21, 78 21" stroke="#93C5FD" stroke-width="2"/>
                <path d="M40 45 C 58 45, 60 69, 78 69" stroke="#CBD5E1" stroke-width="2"/>
                <circle cx="23" cy="45" r="3" fill="#2563EB"/>
                <circle cx="95" cy="21" r="3" fill="#93C5FD"/>
                <circle cx="95" cy="69" r="3" fill="#CBD5E1"/>
              </svg>
            </div>
            <p class="placeholder-title">请先在顶部选择关联船型与排查记录</p>
            <p class="placeholder-sub">选择排查记录后将自动加载已有流程，或创建新流程进行编辑</p>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="fb-panel">
        <!-- 节点属性 -->
        <template v-if="selectedNode">
          <div class="panel-section">
            <div class="panel-title-row">
              <span class="panel-title">{{ nodeTypeName(selectedNode.data.nodeType) }}节点</span>
              <el-button
                v-if="selectedNode.data.nodeType !== 'start'"
                type="danger"
                size="small"
                :icon="Delete"
                @click="deleteSelectedNode"
              >删除节点</el-button>
            </div>

            <label class="field-label">标题</label>
            <el-input v-model="selectedNode.data.label" maxlength="30" placeholder="节点标题" />

            <label class="field-label">详细说明</label>
            <el-input
              v-model="selectedNode.data.description"
              type="textarea"
              :rows="3"
              maxlength="500"
              placeholder="给排查人员的详细指引（可选）"
            />
          </div>

          <!-- 判断节点 -->
          <div class="panel-section" v-if="selectedNode.data.nodeType === 'decision'">
            <label class="field-label">问题</label>
            <el-input
              v-model="selectedNode.data.question"
              type="textarea"
              :rows="2"
              maxlength="200"
              placeholder="向用户提问，例如：电源指示灯是否亮起？"
            />

            <label class="field-label">分支选项（每个选项对应一条出边）</label>
            <div
              v-for="(opt, i) in selectedNode.data.options"
              :key="opt.id"
              class="option-edit-row"
            >
              <el-input
                class="option-input"
                v-model="opt.label"
                maxlength="20"
                :placeholder="'选项 ' + (i + 1)"
                @input="syncDecisionEdgeLabels(selectedNode)"
              />
              <el-button
                :icon="Close"
                circle
                text
                size="small"
                :disabled="selectedNode.data.options.length <= 2"
                title="删除选项"
                @click="removeOption(selectedNode, opt)"
              />
            </div>
            <el-button text :icon="Plus" @click="addOption(selectedNode)">添加选项</el-button>
            <p class="field-tip">提示：选项文字修改后，已连线的分支文字会同步更新。</p>
          </div>

          <!-- 结束节点 -->
          <div class="panel-section" v-if="selectedNode.data.nodeType === 'end'">
            <label class="field-label">排查结果</label>
            <el-radio-group v-model="selectedNode.data.result.resolved">
              <el-radio :value="true">已解决</el-radio>
              <el-radio :value="false">未解决</el-radio>
            </el-radio-group>
            <label class="field-label">结论文本</label>
            <el-input
              v-model="selectedNode.data.result.conclusion"
              type="textarea"
              :rows="2"
              maxlength="300"
              placeholder="例如：保险丝熔断，更换 10A 保险丝后恢复"
            />
            <label class="field-label">建议措施（可选）</label>
            <el-input
              v-model="selectedNode.data.result.suggestion"
              type="textarea"
              :rows="2"
              maxlength="300"
              placeholder="例如：建议备件清单中加入该型号保险丝"
            />
          </div>

          <!-- 附件（开始节点不需要） -->
          <div class="panel-section" v-if="selectedNode.data.nodeType !== 'start'">
            <label class="field-label">图片（最多 9 张，单张 &lt; 2M）</label>
            <div class="photo-list">
              <div v-for="(url, i) in selectedNode.data.media.photos" :key="url + i" class="photo-thumb">
                <img :src="url" alt="配图" />
                <span class="photo-remove" @click="removePhoto(selectedNode, i)">×</span>
              </div>
              <div
                v-if="selectedNode.data.media.photos.length < 9"
                class="photo-add"
                @click="triggerPhotoPick"
              >
                <span v-if="!uploadingPhoto">+</span>
                <span v-else class="uploading-text">…</span>
              </div>
            </div>
            <el-button
                text
                :disabled="!hasRecordMedia('photo')"
                :title="hasRecordMedia('photo') ? '从当前排查记录的图片中选择' : '当前排查记录没有图片'"
                @click="openPhotoPicker"
              >从排查记录选择图片</el-button>

            <label class="field-label">文档（pdf/doc/docx，单个 &lt; 2M）</label>
            <div class="doc-list">
              <div v-for="(url, i) in selectedNode.data.media.docs" :key="url + i" class="doc-row">
                <span class="doc-name" :title="url">{{ docDisplayName(url, i) }}</span>
                <span class="doc-remove" @click="removeDoc(selectedNode, i)">×</span>
              </div>
              <el-button text :icon="Plus" :disabled="uploadingDoc" @click="triggerDocPick">
                {{ uploadingDoc ? '上传中…' : '添加文档' }}
              </el-button>
              <el-button
                text
                :disabled="!hasRecordMedia('doc')"
                :title="hasRecordMedia('doc') ? '从当前排查记录的文档中选择' : '当前排查记录没有文档'"
                @click="openDocPicker"
              >从排查记录选择文档</el-button>
            </div>
          </div>
        </template>

        <!-- 连线属性 -->
        <template v-else-if="selectedEdge">
          <div class="panel-section">
            <div class="panel-title-row">
              <span class="panel-title">连线</span>
              <el-button type="danger" size="small" :icon="Delete" @click="deleteSelectedEdge">删除连线</el-button>
            </div>
            <p class="edge-info">
              {{ edgeEndpointLabel(selectedEdge.source) }}
              <template v-if="selectedEdge.sourceOption">
                （{{ edgeOptionLabel(selectedEdge) }}）
              </template>
              → {{ edgeEndpointLabel(selectedEdge.target) }}
            </p>
            <label class="field-label">连线文字（可选）</label>
            <el-input v-model="selectedEdge.label" maxlength="20" placeholder="显示在连线上的文字" />
          </div>
        </template>

        <!-- 流程信息 -->
        <template v-else>
          <div class="panel-section">
            <span class="panel-title">流程信息</span>
            <label class="field-label">流程名称</label>
            <el-input v-model="meta.name" maxlength="50" placeholder="请输入流程名称" />
            <label class="field-label">流程描述</label>
            <el-input
              v-model="meta.description"
              type="textarea"
              :rows="3"
              maxlength="300"
              placeholder="流程用途说明（可选）"
            />
            <div class="meta-stats">
              <span>节点：{{ vfNodes.length }}</span>
              <span>连线：{{ vfEdges.length }}</span>
            </div>
            <p class="field-tip">作者：{{ meta.author || '未登录' }}</p>
            <p class="field-tip" v-if="!canvasReady">请先在顶部选择船型与排查记录。</p>
            <p class="field-tip" v-else>点击画布中的节点或连线可编辑其属性。</p>
          </div>
        </template>
      </div>
    </div>

    <!-- 隐藏文件选择 -->
    <input
      ref="photoInput"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="handlePhotoPick"
    />
    <input
      ref="docInput"
      type="file"
      accept=".pdf,.doc,.docx"
      style="display: none"
      @change="handleDocPick"
    />

    <!-- 从排查记录选择媒体弹窗 -->
    <el-dialog
      v-model="showMediaPicker"
      :title="mediaPickerMode === 'photo' ? '从排查记录选择图片' : '从排查记录选择文档'"
      width="560px"
      append-to-body
    >
      <div v-if="mediaPickerMode === 'photo'" class="picker-photo-grid">
        <div
          v-for="(url, i) in pickerPhotoOptions"
          :key="url"
          class="picker-photo"
          :class="{ selected: pickerSelected.includes(url), duplicate: isPhotoDuplicate(url) }"
          @click="togglePickerSelect(url)"
        >
          <img :src="url" alt="照片" />
          <span v-if="isPhotoDuplicate(url)" class="picker-badge dup">已添加</span>
          <span v-else-if="pickerSelected.includes(url)" class="picker-badge sel">✓</span>
        </div>
        <p v-if="pickerPhotoOptions.length === 0" class="picker-empty">该排查记录没有图片</p>
      </div>
      <div v-else class="picker-doc-list">
        <div
          v-for="(url, i) in pickerDocOptions"
          :key="url"
          class="picker-doc"
          :class="{ selected: pickerSelected.includes(url), duplicate: isDocDuplicate(url) }"
          @click="togglePickerSelect(url)"
        >
          <span class="picker-doc-name" :title="url">{{ docDisplayName(url, i) }}</span>
          <span v-if="isDocDuplicate(url)" class="picker-badge dup">已添加</span>
          <span v-else-if="pickerSelected.includes(url)" class="picker-badge sel">✓</span>
        </div>
        <p v-if="pickerDocOptions.length === 0" class="picker-empty">该排查记录没有文档</p>
      </div>
      <template #footer>
        <el-button @click="showMediaPicker = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="pickerSelected.length === 0"
          @click="confirmMediaPicker"
        >{{ pickerSelected.length ? `添加选中 ${pickerSelected.length} 项` : '添加选中' }}</el-button>
      </template>
    </el-dialog>

    <!-- 校验报告弹窗 -->
    <el-dialog
      v-model="showReport"
      :title="reportErrors.length === 0 ? '校验通过' : `校验未通过（${reportErrors.length} 项）`"
      width="560px"
      append-to-body
    >
      <div v-if="reportErrors.length === 0" class="report-ok">
        流程结构完整，可以导出或投入使用。
      </div>
      <ul v-else class="report-list">
        <li
          v-for="(err, i) in reportErrors"
          :key="i"
          class="report-item"
          :class="{ clickable: !!err.nodeId }"
          @click="locateNode(err)"
        >
          {{ i + 1 }}. {{ err.message }}
          <span v-if="err.nodeId" class="report-locate">点击定位 →</span>
        </li>
      </ul>
      <template #footer>
        <el-button @click="showReport = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="showPreview"
      title="流程预览（模拟使用者视角）"
      width="640px"
      append-to-body
      destroy-on-close
    >
      <FlowRunner v-if="previewFlow" :flow="previewFlow" :key="previewKey" />
    </el-dialog>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Close, Delete, FullScreen, Aim, View, Upload, Download, Promotion } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getUsername } from '@/utils/token'
import { uploadFile } from '@/utils/uploadQueue'
import { deleteFiles } from '@/utils/file'
import FlowNode from './flow/FlowNode.vue'
import FlowRunner from './flow/FlowRunner.vue'
import {
  FLOW_VERSION,
  NODE_TYPE_META,
  createFlow,
  createNode,
  genId,
  validateFlow,
  downloadFlow,
  parseFlow,
  readFileText,
  formatTime
} from '@/utils/flowSchema'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const DRAFT_KEY = 'ocskill_flow_draft'
const MAX_PHOTOS = 9
const MAX_FILE_SIZE = 2 * 1024 * 1024
const DOC_EXTS = ['pdf', 'doc', 'docx']

export default {
  name: 'FlowBuilderPage',
  components: { VueFlow, Background, Controls, FlowNode, FlowRunner },
  setup() {
    // 传字符串 id 即可；传 options 对象会在非 VueFlow 组件内触发库告警
    const vf = useVueFlow('flow-builder-canvas')
    return {
      vfOnConnect: vf.onConnect,
      vfOnNodesChange: vf.onNodesChange,
      vfAddEdges: vf.addEdges,
      vfAddNodes: vf.addNodes,
      vfRemoveEdges: vf.removeEdges,
      vfRemoveNodes: vf.removeNodes,
      vfScreenToFlow: vf.screenToFlowCoordinate,
      vfOnNodeClick: vf.onNodeClick,
      vfOnEdgeClick: vf.onEdgeClick,
      vfOnPaneClick: vf.onPaneClick,
      vfOnMoveEnd: vf.onMoveEnd,
      vfSetCenter: vf.setCenter,
      vfSetViewport: vf.setViewport,
      vfFitView: vf.fitView
    }
  },
  data() {
    return {
      // 图标引用（markRaw 避免组件被响应式化）
      Plus: markRaw(Plus), Close: markRaw(Close), Delete: markRaw(Delete),
      FullScreen: markRaw(FullScreen), Aim: markRaw(Aim), View: markRaw(View),
      Upload: markRaw(Upload), Download: markRaw(Download), Promotion: markRaw(Promotion),
      // Vue Flow 画布元素（业务数据存放在 node.data 上）
      vfNodes: [],
      vfEdges: [],
      // 流程元信息
      meta: {
        id: '',
        name: '未命名排查流程',
        shipId: null,
        shipName: '',
        bindTrbstId: null,
        description: '',
        author: '',
        createTime: ''
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeId: null,
      selectedEdgeId: null,
      shipList: [],
      recordList: [],
      loadingRecords: false,
      uploadingPhoto: false,
      uploadingDoc: false,
      loadingFlow: false,
      // 画布全屏编辑
      canvasFullscreen: false,
      showReport: false,
      reportErrors: [],
      submitting: false,
      showPreview: false,
      previewFlow: null,
      previewKey: 0,
      // 从排查记录选择媒体弹窗
      showMediaPicker: false,
      mediaPickerMode: 'photo',
      pickerSelected: [],
      // 编辑脏标记：仅用户实际修改才置 true，用于切换船型/记录时的丢失确认
      dirty: false,
      // loadFlow 期间抑制 watcher 把数据回填误判为编辑
      suppressDirty: false,
      // 切换确认回退用
      previousShipId: null,
      previousRecordId: null,
      paletteItems: [
        { type: 'start', label: '开始节点' },
        { type: 'step', label: '步骤节点' },
        { type: 'decision', label: '判断节点' },
        { type: 'end', label: '结束节点' }
      ],
      draftTimer: null,
      draftFlushHandler: null
    }
  },
  computed: {
    selectedNode() {
      return this.vfNodes.find(n => n.id === this.selectedNodeId) || null
    },
    selectedEdge() {
      return this.vfEdges.find(e => e.id === this.selectedEdgeId) || null
    },
    /** 船型与排查记录均已选择才允许编辑画布 */
    canvasReady() {
      return !!this.meta.shipId && !!this.meta.bindTrbstId
    },
    /** 当前绑定的排查记录对象（含 photo/doc/flowUrl） */
    boundRecord() {
      if (!this.meta.bindTrbstId) return null
      return this.recordList.find(r => r.id === this.meta.bindTrbstId) || null
    },
    pickerPhotoOptions() {
      const r = this.boundRecord
      return (r && Array.isArray(r.photo)) ? r.photo : []
    },
    pickerDocOptions() {
      const r = this.boundRecord
      return (r && Array.isArray(r.doc)) ? r.doc : []
    }
  },
  watch: {
    vfNodes: {
      deep: true,
      handler() {
        if (!this.suppressDirty) this.dirty = true
        this.scheduleDraftSave()
      }
    },
    vfEdges: {
      deep: true,
      handler() {
        if (!this.suppressDirty) this.dirty = true
        this.scheduleDraftSave()
      }
    },
    meta: {
      deep: true,
      handler() {
        if (!this.suppressDirty) this.dirty = true
        this.scheduleDraftSave()
      }
    }
  },
  created() {
    this.meta.author = getUsername() || ''
    this.fetchShips()
    // 画布事件
    this.vfOnConnect(this.handleConnect)
    // 节点删除（Delete 键或面板按钮）统一走 changes 管线，在此同步清理附件
    this.vfOnNodesChange(this.handleNodesChange)
    this.vfOnNodeClick(({ node }) => {
      this.selectedNodeId = node.id
      this.selectedEdgeId = null
    })
    this.vfOnEdgeClick(({ edge }) => {
      this.selectedEdgeId = edge.id
      this.selectedNodeId = null
    })
    this.vfOnPaneClick(() => {
      this.selectedNodeId = null
      this.selectedEdgeId = null
    })
    this.vfOnMoveEnd(({ viewport }) => {
      this.viewport = { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
    })
  },
  mounted() {
    this.restoreDraftOrInit()
    // 全屏编辑时按 Esc 退出
    this._onKeydown = (e) => {
      if (e.key === 'Escape' && this.canvasFullscreen) this.toggleFullscreen(false)
    }
    window.addEventListener('keydown', this._onKeydown)
  },
  beforeMount() {
    // 关闭/刷新页面前兜底落盘草稿，避免 1.2s 防抖窗口内的编辑丢失
    this.draftFlushHandler = () => this.flushDraft()
    window.addEventListener('beforeunload', this.draftFlushHandler)
  },
  beforeUnmount() {
    if (this.draftFlushHandler) {
      window.removeEventListener('beforeunload', this.draftFlushHandler)
      this.draftFlushHandler = null
    }
    if (this._onKeydown) {
      window.removeEventListener('keydown', this._onKeydown)
      this._onKeydown = null
    }
    this.flushDraft()
  },
  methods: {
    nodeTypeName(type) {
      return (NODE_TYPE_META[type] && NODE_TYPE_META[type].label) || type
    },
    /** 切换画布全屏编辑；传 boolean 显式指定目标状态。尺寸变化后重新 fitView */
    toggleFullscreen(force) {
      const next = typeof force === 'boolean' ? force : !this.canvasFullscreen
      this.canvasFullscreen = next
      // 容器尺寸变化后 VueFlow 需重新计算视口，等 DOM 切换到 fixed 定位后再 fitView
      this.$nextTick(() => {
        if (this.vfNodes.length > 0) {
          this.vfFitView({ padding: 0.2 })
        }
      })
    },

    // ====== 船型与绑定记录 ======
    fetchShips() {
      request.get('/ships').then(res => {
        if (res.data && res.data.code === 1) {
          // 后端返回字段为 id/name，与其他页面保持一致映射为 shipId/name
          this.shipList = (res.data.data || []).map(item => ({
            shipId: item.id,
            name: item.name
          }))
        }
      }).catch(() => {
        ElMessage({ message: '获取船型列表失败', type: 'error' })
      })
    },
    async handleShipChange(shipId) {
      // v-model 已先于 @change 更新，提前抑制 watcher 把本次切换误判为编辑
      this.suppressDirty = true
      // 有未提交编辑时确认，避免误切丢失
      if (this.dirty && this.meta.bindTrbstId) {
        try {
          await ElMessageBox.confirm(
            '切换船型将清空当前排查记录选择并丢失未提交的编辑，确定继续？',
            '切换船型',
            { confirmButtonText: '切换', cancelButtonText: '取消', type: 'warning' }
          )
        } catch (e) {
          // 取消：恢复原船型选择（dirty 维持原状）
          const prev = this.previousShipId
          this.$nextTick(() => {
            this.meta.shipId = prev
            this.suppressDirty = false
          })
          return
        }
      }
      this.previousShipId = shipId
      const ship = this.shipList.find(s => s.shipId === shipId)
      this.meta.shipName = ship ? ship.name : ''
      // 船型变化后原绑定记录不再适用，重置并重新拉取候选
      this.meta.bindTrbstId = null
      this.previousRecordId = null
      this.recordList = []
      this.vfNodes = []
      this.vfEdges = []
      this.selectedNodeId = null
      this.selectedEdgeId = null
      // 待本批次 watcher（由 v-model/重置触发）跑完再放开抑制并清脏
      this.$nextTick(() => {
        this.dirty = false
        this.suppressDirty = false
      })
      if (shipId) this.fetchRecords(shipId)
    },
    /** 选择排查记录：有 flowUrl 则下载加载，否则新建空流程绑定到该记录 */
    async handleRecordChange(recordId) {
      // v-model 已先于 @change 更新，提前抑制 watcher 把本次切换误判为编辑
      this.suppressDirty = true
      // 清空选择：放弃当前编辑并隐藏画布
      if (!recordId) {
        if (this.dirty && this.vfNodes.length > 0) {
          try {
            await ElMessageBox.confirm(
              '清空排查记录将丢失当前未提交的编辑，确定继续？',
              '清空排查记录',
              { confirmButtonText: '清空', cancelButtonText: '取消', type: 'warning' }
            )
          } catch (e) {
            const prev = this.previousRecordId
            this.$nextTick(() => {
              this.meta.bindTrbstId = prev
              this.suppressDirty = false
            })
            return
          }
        }
        this.meta.bindTrbstId = null
        this.previousRecordId = null
        this.vfNodes = []
        this.vfEdges = []
        this.selectedNodeId = null
        this.selectedEdgeId = null
        this.$nextTick(() => {
          this.dirty = false
          this.suppressDirty = false
        })
        return
      }
      // 切换到不同记录且有未提交编辑时确认
      if (this.dirty && this.vfNodes.length > 0) {
        try {
          await ElMessageBox.confirm(
            '切换排查记录将丢失当前未提交的编辑，确定继续？',
            '切换排查记录',
            { confirmButtonText: '切换', cancelButtonText: '取消', type: 'warning' }
          )
        } catch (e) {
          const prev = this.previousRecordId
          this.$nextTick(() => {
            this.meta.bindTrbstId = prev
            this.suppressDirty = false
          })
          return
        }
      }
      this.previousRecordId = recordId
      this.meta.bindTrbstId = recordId
      const record = this.recordList.find(r => r.id === recordId)
      if (record && record.flowUrl) {
        // loadFlow 内部会接管 suppressDirty 并在 nextTick 重置
        await this.loadFlowFromUrl(record.flowUrl)
      } else {
        this.initNewFlowForCurrentRecord()
      }
      // 选择记录后自动居中视口，确保全部节点可见；延时等待 VueFlow 节点 DOM 完全渲染
      this.$nextTick(() => {
        setTimeout(() => {
          if (this.vfNodes.length > 0) this.vfFitView({ padding: 0.2 })
        }, 120)
      })
    },
    /** 从 flowUrl 下载流程 JSON 并加载，失败降级为新建空流程 */
    async loadFlowFromUrl(flowUrl) {
      this.loadingFlow = true
      try {
        const res = await fetch(flowUrl, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        const { flow, errors } = parseFlow(text)
        if (!flow) {
          ElMessage({ message: errors[0] || '流程文件解析失败，已创建新流程', type: 'warning' })
          this.initNewFlowForCurrentRecord()
          return
        }
        // 强制对齐当前选择的船型与记录（以顶部选择为准，忽略文件内可能不一致的绑定）
        flow.shipId = this.meta.shipId
        flow.shipName = this.meta.shipName
        flow.bindTrbstId = this.meta.bindTrbstId
        this.loadFlow(flow)
        if (errors.length > 0) {
          ElMessage({
            message: `流程已加载，${errors.length} 处自动修正：${errors.join('；')}`,
            type: 'warning',
            duration: 6000
          })
        } else {
          ElMessage({ message: '已加载该记录的现有流程', type: 'success' })
        }
      } catch (err) {
        ElMessage({ message: '下载流程文件失败，已创建新流程', type: 'warning' })
        this.initNewFlowForCurrentRecord()
      } finally {
        this.loadingFlow = false
      }
    },
    /** 为当前选择的船型+记录新建一个空流程；若该记录有排查步骤则注入为 step 节点链供参考 */
    initNewFlowForCurrentRecord() {
      const flow = createFlow({
        author: this.meta.author,
        shipId: this.meta.shipId,
        shipName: this.meta.shipName,
        bindTrbstId: this.meta.bindTrbstId
      })
      // 把排查记录的 shooting 步骤转成 step 节点骨架，串在 start 之后，供用户参考修改
      const record = this.boundRecord
      const steps = this.parseShootingSteps(record && record.shooting)
      if (steps.length > 0) {
        this.injectStepsSkeleton(flow, steps)
      }
      this.loadFlow(flow)
      ElMessage({
        message: steps.length > 0
          ? `已创建新流程，并注入 ${steps.length} 条排查步骤供参考`
          : '该记录暂无流程，已创建新流程',
        type: 'info'
      })
    },
    /** 解析排查步骤文本（按中英文分号分隔，去空白去空段） */
    parseShootingSteps(shooting) {
      if (!shooting || typeof shooting !== 'string') return []
      return shooting.split(/[；;]/).map(s => s.trim()).filter(Boolean)
    },
    /** 把步骤数组转成 step 节点注入画布（不自动连线，由用户自行连接），垂直布局 */
    injectStepsSkeleton(flow, steps) {
      const start = flow.nodes.find(n => n.type === 'start')
      const startX = start ? start.position.x : 80
      const startY = start ? start.position.y : 160
      const gapY = 130
      steps.forEach((text, i) => {
        const node = createNode('step', { x: startX, y: startY + (i + 1) * gapY })
        // label 用截断便于画布显示，完整步骤存 description 供属性面板参考编辑
        node.label = this.truncateText(text, 24)
        node.description = text
        flow.nodes.push(node)
      })
    },
    /** 拉取指定船型下的排查记录，供"绑定排查记录"下拉选择 */
    fetchRecords(shipId) {
      if (!shipId) {
        this.recordList = []
        return
      }
      this.loadingRecords = true
      request.get('/trbsts', { params: { shipId, page: 1, pageSize: 100 } }).then(res => {
        const rows = (res.data && res.data.rows) || []
        this.recordList = rows.map(r => ({
          id: r.id,
          phenomenon: this.truncateText(r.phenomenon || '(无现象描述)', 40),
          // 后端在检索排查记录时已同步返回 flowUrl/photo/doc，供加载流程与节点附件选取
          flowUrl: r.flowUrl || '',
          photo: Array.isArray(r.photo) ? [...r.photo] : [],
          doc: Array.isArray(r.doc) ? [...r.doc] : [],
          // shooting 原文用于新建流程时注入步骤骨架
          shooting: r.shooting || ''
        }))
        // 已绑定记录不在当前列表（被删除或超出前100条）时保留占位，避免下拉显示原始 id
        if (this.meta.bindTrbstId && !this.recordList.some(r => r.id === this.meta.bindTrbstId)) {
          this.recordList.unshift({
            id: this.meta.bindTrbstId,
            phenomenon: `记录 #${this.meta.bindTrbstId}（不在当前船型前 100 条中）`,
            flowUrl: '',
            photo: [],
            doc: [],
            shooting: ''
          })
        }
      }).catch(() => {
        this.recordList = []
        ElMessage({ message: '获取排查记录列表失败', type: 'error' })
      }).finally(() => {
        this.loadingRecords = false
      })
    },
    truncateText(text, max) {
      return text.length > max ? text.slice(0, max) + '…' : text
    },

    // ====== schema <-> Vue Flow 转换 ======
    schemaNodeToVf(node) {
      // 防御性兜底：position 缺失或格式异常时回退到原点，避免 VueFlow moveEnd 读 undefined.x 崩溃
      const pos = (node && node.position && typeof node.position === 'object') ? node.position : {}
      return {
        id: node.id,
        type: 'flow',
        position: { x: Number(pos.x) || 0, y: Number(pos.y) || 0 },
        deletable: node.type !== 'start',
        data: {
          nodeType: node.type,
          label: node.label,
          description: node.description,
          media: {
            photos: [...((node.media && node.media.photos) || [])],
            docs: [...((node.media && node.media.docs) || [])]
          },
          question: node.question || '',
          options: node.options ? node.options.map(o => ({ ...o })) : [],
          result: node.result ? { ...node.result } : null
        }
      }
    },
    schemaEdgeToVf(edge) {
      return {
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceOption || undefined,
        target: edge.target,
        targetHandle: 'in',
        label: edge.label || ''
      }
    },
    /** 当前画布状态 -> schema 流程对象 */
    buildFlow() {
      const nodes = this.vfNodes.map(n => {
        const d = n.data
        const node = {
          id: n.id,
          type: d.nodeType,
          label: d.label || '',
          description: d.description || '',
          position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
          media: {
            photos: [...(d.media.photos || [])],
            docs: [...(d.media.docs || [])]
          }
        }
        if (d.nodeType === 'decision') {
          node.question = d.question || ''
          node.options = (d.options || []).map(o => ({ id: o.id, label: o.label }))
        }
        if (d.nodeType === 'end') {
          node.result = {
            resolved: !d.result || d.result.resolved !== false,
            conclusion: (d.result && d.result.conclusion) || '',
            suggestion: (d.result && d.result.suggestion) || ''
          }
        }
        return node
      })
      const edges = this.vfEdges.map(e => ({
        id: e.id,
        source: e.source,
        sourceOption: e.sourceHandle || null,
        target: e.target,
        label: typeof e.label === 'string' ? e.label : ''
      }))
      return {
        version: FLOW_VERSION,
        id: this.meta.id || genId('flow'),
        name: this.meta.name,
        shipId: this.meta.shipId,
        shipName: this.meta.shipName,
        bindTrbstId: this.meta.bindTrbstId || null,
        description: this.meta.description,
        author: this.meta.author,
        createTime: this.meta.createTime,
        updateTime: '',
        canvas: {
          zoom: this.viewport.zoom,
          offsetX: Math.round(this.viewport.x),
          offsetY: Math.round(this.viewport.y)
        },
        nodes,
        edges
      }
    },
    /** schema 流程对象 -> 画布 */
    loadFlow(flow) {
      // 加载期间抑制 watcher 把数据回填误判为用户编辑
      this.suppressDirty = true
      this.meta = {
        id: flow.id,
        name: flow.name,
        shipId: flow.shipId,
        shipName: flow.shipName || '',
        bindTrbstId: flow.bindTrbstId || null,
        description: flow.description || '',
        author: flow.author || getUsername() || '',
        createTime: flow.createTime || ''
      }
      this.vfNodes = flow.nodes.map(n => this.schemaNodeToVf(n))
      this.vfEdges = flow.edges.map(e => this.schemaEdgeToVf(e))
      this.selectedNodeId = null
      this.selectedEdgeId = null
      // 同步 previous* 用于切换确认回退
      this.previousShipId = this.meta.shipId
      this.previousRecordId = this.meta.bindTrbstId
      // 已关联船型时拉取候选排查记录，保证绑定下拉能正确回显
      if (this.meta.shipId) {
        this.fetchRecords(this.meta.shipId)
      } else {
        this.recordList = []
      }
      this.$nextTick(() => {
        const c = flow.canvas || { zoom: 1, offsetX: 0, offsetY: 0 }
        if (c.offsetX || c.offsetY || c.zoom !== 1) {
          this.vfSetViewport({ x: c.offsetX, y: c.offsetY, zoom: c.zoom })
        } else if (this.vfNodes.length > 0) {
          this.vfFitView({ padding: 0.2 })
        }
        // watcher 已在加载期间触发，重置脏标记
        this.dirty = false
        this.suppressDirty = false
      })
    },

    // ====== 初始化 / 草稿 ======
    restoreDraftOrInit() {
      let restored = false
      try {
        const text = localStorage.getItem(DRAFT_KEY)
        if (text) {
          const { flow, errors } = parseFlow(text)
          // 仅当草稿含已绑定船型+排查记录时才恢复，否则进入未选择空状态
          if (flow && errors.length === 0 && flow.shipId && flow.bindTrbstId) {
            this.loadFlow(flow)
            restored = true
            ElMessage({ message: '已恢复上次未提交的草稿', type: 'info' })
          }
        }
      } catch (e) {
        // 草稿损坏则按未选择处理
      }
      if (!restored) {
        // 进入未选择状态：画布隐藏，等用户选择船型+排查记录后再加载/新建流程
        this.suppressDirty = true
        this.meta.shipId = null
        this.meta.shipName = ''
        this.meta.bindTrbstId = null
        this.meta.id = genId('flow')
        this.meta.name = '未命名排查流程'
        this.meta.description = ''
        this.meta.createTime = ''
        this.vfNodes = []
        this.vfEdges = []
        this.previousShipId = null
        this.previousRecordId = null
        this.$nextTick(() => {
          this.dirty = false
          this.suppressDirty = false
        })
      }
    },
    scheduleDraftSave() {
      if (this.draftTimer) clearTimeout(this.draftTimer)
      this.draftTimer = setTimeout(() => {
        this.draftTimer = null
        this.writeDraft()
      }, 1200)
    },
    /** 立即写入草稿（跳过防抖），用于关页/导出等时机 */
    flushDraft() {
      if (this.draftTimer) {
        clearTimeout(this.draftTimer)
        this.draftTimer = null
      }
      this.writeDraft()
    },
    writeDraft() {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(this.buildFlow()))
      } catch (e) {
        // 存储超限时静默失败，不影响编辑
      }
    },
    clearDraft() {
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch (e) { /* ignore */ }
    },

    // ====== 组件面板拖入 ======
    onDragStart(event, type) {
      event.dataTransfer.setData('application/ocskill-node', type)
      event.dataTransfer.effectAllowed = 'move'
    },
    onDrop(event) {
      const type = event.dataTransfer.getData('application/ocskill-node')
      if (!type) return
      if (type === 'start') {
        ElMessage({ message: '流程已有且只能有 1 个开始节点', type: 'warning' })
        return
      }
      const point = this.vfScreenToFlow({ x: event.clientX, y: event.clientY })
      // 以鼠标落点为节点中心，避免节点出现在鼠标右下方、边缘拖放时跑出视口
      const schemaNode = createNode(type, {
        x: Math.round(point.x - 95),
        y: Math.round(point.y - 40)
      })
      this.vfAddNodes([this.schemaNodeToVf(schemaNode)])
      this.selectedNodeId = schemaNode.id
      this.selectedEdgeId = null
    },

    // ====== 连线 ======
    handleConnect(params) {
      const sourceNode = this.vfNodes.find(n => n.id === params.source)
      const targetNode = this.vfNodes.find(n => n.id === params.target)
      if (!sourceNode || !targetNode) return

      if (params.source === params.target) {
        ElMessage({ message: '不允许连接到节点自身', type: 'warning' })
        return
      }
      if (sourceNode.data.nodeType === 'end') {
        ElMessage({ message: '结束节点没有出边', type: 'warning' })
        return
      }
      // 重复连线检查
      const duplicated = this.vfEdges.some(e =>
        e.source === params.source &&
        e.target === params.target &&
        (e.sourceHandle || null) === (params.sourceHandle || null)
      )
      if (duplicated) {
        ElMessage({ message: '该连线已存在', type: 'warning' })
        return
      }
      let label = ''
      if (sourceNode.data.nodeType === 'decision') {
        const opt = (sourceNode.data.options || []).find(o => o.id === params.sourceHandle)
        if (!opt) {
          ElMessage({ message: '判断节点必须从选项锚点拖出连线', type: 'warning' })
          return
        }
        const occupied = this.vfEdges.some(e => e.source === params.source && e.sourceHandle === params.sourceHandle)
        if (occupied) {
          ElMessage({ message: `选项「${opt.label}」已连线，请先删除原连线`, type: 'warning' })
          return
        }
        label = opt.label
      } else {
        const occupied = this.vfEdges.some(e => e.source === params.source)
        if (occupied) {
          ElMessage({ message: '该节点已有出边，请先删除原连线', type: 'warning' })
          return
        }
      }
      this.vfAddEdges([{
        id: genId('e'),
        source: params.source,
        sourceHandle: params.sourceHandle,
        target: params.target,
        targetHandle: params.targetHandle || 'in',
        label
      }])
    },
    /** 判断节点选项文字修改后，同步对应连线文字 */
    syncDecisionEdgeLabels(node) {
      ;(node.data.options || []).forEach(opt => {
        const edge = this.vfEdges.find(e => e.source === node.id && e.sourceHandle === opt.id)
        if (edge) edge.label = opt.label
      })
    },

    // ====== 节点 / 连线删除 ======
    /** 节点被删除时（Delete 键或面板按钮均触发 nodesChange remove）清理其 OSS 附件，避免孤儿文件 */
    handleNodesChange(changes) {
      const removed = changes.filter(c => c.type === 'remove')
      if (removed.length === 0) return
      const urls = []
      removed.forEach(c => {
        // 此处 v-model 尚未同步，vfNodes 中仍可取到被删节点的附件数据
        const node = this.vfNodes.find(n => n.id === c.id)
        urls.push(...this.nodeMediaUrls(node))
      })
      if (urls.length > 0) {
        deleteFiles(urls)
      }
    },
    /** 取节点上所有附件（图片 + 文档）的 OSS 链接 */
    nodeMediaUrls(node) {
      const m = node && node.data && node.data.media
      if (!m) return []
      return [...(m.photos || []), ...(m.docs || [])]
    },
    deleteSelectedNode() {
      const node = this.selectedNode
      if (!node) return
      if (node.data.nodeType === 'start') {
        ElMessage({ message: '开始节点不可删除', type: 'warning' })
        return
      }
      this.vfRemoveNodes([node.id])
      this.selectedNodeId = null
    },
    deleteSelectedEdge() {
      const edge = this.selectedEdge
      if (!edge) return
      this.vfRemoveEdges([edge.id])
      this.selectedEdgeId = null
    },

    // ====== 判断节点选项维护 ======
    addOption(node) {
      if (node.data.options.length >= 6) {
        ElMessage({ message: '最多 6 个分支选项', type: 'warning' })
        return
      }
      node.data.options.push({ id: genId('opt'), label: `选项 ${node.data.options.length + 1}` })
    },
    removeOption(node, opt) {
      if (node.data.options.length <= 2) {
        ElMessage({ message: '判断节点至少保留 2 个选项', type: 'warning' })
        return
      }
      // 同步删除该选项的连线
      const linked = this.vfEdges.filter(e => e.source === node.id && e.sourceHandle === opt.id)
      if (linked.length > 0) {
        this.vfRemoveEdges(linked.map(e => e.id))
      }
      node.data.options = node.data.options.filter(o => o.id !== opt.id)
    },

    // ====== 附件上传 ======
    triggerPhotoPick() {
      if (this.uploadingPhoto) return
      this.$refs.photoInput.click()
    },
    triggerDocPick() {
      if (this.uploadingDoc) return
      this.$refs.docInput.click()
    },
    async handlePhotoPick(e) {
      const files = Array.from(e.target.files)
      e.target.value = ''
      const node = this.selectedNode
      if (!node || files.length === 0) return
      if (node.data.media.photos.length + files.length > MAX_PHOTOS) {
        ElMessage({ message: '最多上传 9 张照片', type: 'warning' })
        return
      }
      // 超限文件只跳过自身，不中止其余合法文件的上传
      const oversized = []
      const validFiles = files.filter(f => {
        if (f.size > MAX_FILE_SIZE) {
          oversized.push(f.name)
          return false
        }
        return true
      })
      if (oversized.length > 0) {
        ElMessage({ message: `「${oversized.join('、')}」超过 2M，已跳过`, type: 'warning' })
      }
      if (validFiles.length === 0) return
      this.uploadingPhoto = true
      try {
        for (const f of validFiles) {
          const url = await uploadFile(f)
          node.data.media.photos.push(url)
        }
        ElMessage({ message: '图片上传成功', type: 'success' })
      } catch (err) {
        ElMessage({ message: err.message || '图片上传失败', type: 'error' })
      } finally {
        this.uploadingPhoto = false
      }
    },
    async handleDocPick(e) {
      const file = e.target.files[0]
      e.target.value = ''
      const node = this.selectedNode
      if (!node || !file) return
      const ext = (file.name.split('.').pop() || '').toLowerCase()
      if (!DOC_EXTS.includes(ext)) {
        ElMessage({ message: '仅支持 pdf/doc/docx 格式', type: 'warning' })
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        ElMessage({ message: '文档不能超过 2M', type: 'warning' })
        return
      }
      this.uploadingDoc = true
      try {
        const url = await uploadFile(file)
        node.data.media.docs.push(url)
        ElMessage({ message: '文档上传成功', type: 'success' })
      } catch (err) {
        ElMessage({ message: err.message || '文档上传失败', type: 'error' })
      } finally {
        this.uploadingDoc = false
      }
    },
    /** 删除单张附件会同步删除 OSS 源文件且不可恢复，需二次确认 */
    async removePhoto(node, index) {
      const url = node.data.media.photos[index]
      try {
        await ElMessageBox.confirm('删除后源文件将被同步删除且不可恢复，确定删除该图片？', '删除图片', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (e) {
        return
      }
      node.data.media.photos.splice(index, 1)
      deleteFiles(url)
    },
    async removeDoc(node, index) {
      const url = node.data.media.docs[index]
      try {
        await ElMessageBox.confirm('删除后源文件将被同步删除且不可恢复，确定删除该文档？', '删除文档', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (e) {
        return
      }
      node.data.media.docs.splice(index, 1)
      deleteFiles(url)
    },
    docDisplayName(url, index) {
      try {
        const seg = decodeURIComponent(url.split('/').pop() || '')
        return seg || `文档 ${index + 1}`
      } catch (e) {
        return `文档 ${index + 1}`
      }
    },

    // ====== 从排查记录选择媒体 ======
    /** 排查记录是否含可选媒体（用于按钮 disabled 判断） */
    hasRecordMedia(kind) {
      const r = this.boundRecord
      if (!r) return false
      if (kind === 'photo') return Array.isArray(r.photo) && r.photo.length > 0
      return Array.isArray(r.doc) && r.doc.length > 0
    },
    openPhotoPicker() {
      const node = this.selectedNode
      if (!node) return
      if (!this.hasRecordMedia('photo')) {
        ElMessage({ message: '当前排查记录没有可选图片', type: 'info' })
        return
      }
      this.mediaPickerMode = 'photo'
      this.pickerSelected = []
      this.showMediaPicker = true
    },
    openDocPicker() {
      const node = this.selectedNode
      if (!node) return
      if (!this.hasRecordMedia('doc')) {
        ElMessage({ message: '当前排查记录没有可选文档', type: 'info' })
        return
      }
      this.mediaPickerMode = 'doc'
      this.pickerSelected = []
      this.showMediaPicker = true
    },
    isPhotoDuplicate(url) {
      const node = this.selectedNode
      return !!(node && node.data.media.photos.includes(url))
    },
    isDocDuplicate(url) {
      const node = this.selectedNode
      return !!(node && node.data.media.docs.includes(url))
    },
    togglePickerSelect(url) {
      if (this.mediaPickerMode === 'photo' && this.isPhotoDuplicate(url)) return
      if (this.mediaPickerMode === 'doc' && this.isDocDuplicate(url)) return
      const i = this.pickerSelected.indexOf(url)
      if (i >= 0) this.pickerSelected.splice(i, 1)
      else this.pickerSelected.push(url)
    },
    confirmMediaPicker() {
      const node = this.selectedNode
      if (!node || this.pickerSelected.length === 0) {
        this.showMediaPicker = false
        return
      }
      if (this.mediaPickerMode === 'photo') {
        const remaining = MAX_PHOTOS - node.data.media.photos.length
        if (this.pickerSelected.length > remaining) {
          ElMessage({ message: `最多还能添加 ${remaining} 张图片`, type: 'warning' })
          return
        }
        node.data.media.photos.push(...this.pickerSelected)
        ElMessage({ message: `已添加 ${this.pickerSelected.length} 张图片`, type: 'success' })
      } else {
        node.data.media.docs.push(...this.pickerSelected)
        ElMessage({ message: `已添加 ${this.pickerSelected.length} 个文档`, type: 'success' })
      }
      this.dirty = true
      this.showMediaPicker = false
    },

    // ====== 连线面板辅助 ======
    edgeEndpointLabel(nodeId) {
      const node = this.vfNodes.find(n => n.id === nodeId)
      if (!node) return nodeId
      return node.data.label || this.nodeTypeName(node.data.nodeType)
    },
    edgeOptionLabel(edge) {
      const node = this.vfNodes.find(n => n.id === edge.source)
      if (!node) return ''
      const opt = (node.data.options || []).find(o => o.id === edge.sourceHandle)
      return opt ? opt.label : ''
    },

    // ====== 工具栏动作 ======
    async handleNew() {
      try {
        await ElMessageBox.confirm(
          '将清空当前编辑与草稿，并回到未选择状态，确定继续？',
          '重置',
          { confirmButtonText: '重置', cancelButtonText: '取消', type: 'warning' }
        )
      } catch (e) {
        return
      }
      this.clearDraft()
      this.suppressDirty = true
      this.meta.shipId = null
      this.meta.shipName = ''
      this.meta.bindTrbstId = null
      this.meta.id = genId('flow')
      this.meta.name = '未命名排查流程'
      this.meta.description = ''
      this.meta.createTime = ''
      this.vfNodes = []
      this.vfEdges = []
      this.recordList = []
      this.selectedNodeId = null
      this.selectedEdgeId = null
      this.previousShipId = null
      this.previousRecordId = null
      this.$nextTick(() => {
        this.dirty = false
        this.suppressDirty = false
      })
    },
    runValidate(requireBindTrbst = false) {
      const flow = this.buildFlow()
      const { valid, errors } = validateFlow(flow, { requireBindTrbst })
      this.reportErrors = errors
      return { valid, errors, flow }
    },
    handleValidate() {
      this.runValidate()
      this.showReport = true
    },
    handlePreview() {
      const { valid, flow } = this.runValidate()
      if (!valid) {
        this.showReport = true
        ElMessage({ message: '校验未通过，请先修复问题再预览', type: 'warning' })
        return
      }
      this.previewFlow = flow
      this.previewKey += 1
      this.showPreview = true
    },
    handleExport() {
      const { valid, flow } = this.runValidate()
      if (!valid) {
        this.showReport = true
        ElMessage({ message: '校验未通过，请修复后再导出', type: 'error' })
        return
      }
      downloadFlow(flow)
      this.meta.id = flow.id
      // 导出即视为一次保存：草稿更新为当前状态，下次进入可继续编辑
      this.flushDraft()
      ElMessage({ message: '流程文件已导出', type: 'success' })
    },
    /** 提交到后端：校验（必须绑定排查记录）→ 上传流程 JSON 到 OSS → PUT /trbsts/addflow 绑定 */
    async handleSubmit() {
      if (this.submitting) return
      const { valid, flow } = this.runValidate(true)
      if (!valid) {
        this.showReport = true
        ElMessage({ message: '校验未通过，请修复后再提交（提交需先绑定故障排查记录）', type: 'error' })
        return
      }
      flow.updateTime = formatTime(new Date())
      this.submitting = true
      // 记录提交前该排查记录已绑定的旧流程地址，提交成功后清理，避免 OSS 残留孤儿文件
      const oldFlowUrl = (this.boundRecord && this.boundRecord.flowUrl) || ''
      let flowUrl = ''
      try {
        const file = new File(
          [JSON.stringify(flow, null, 2)],
          this.submitFileName(flow),
          { type: 'application/json' }
        )
        flowUrl = await uploadFile(file)
        const res = await request.put('/trbsts/addflow', { id: flow.bindTrbstId, flowUrl })
        if (res.data && res.data.code === 1) {
          // 后端已绑定新地址后，再删除旧流程文件（删除失败仅告警不阻断主流程）。
          // 放在 PUT 成功之后，保证记录始终持有有效 flowUrl，避免先删旧文件导致绑定悬空
          if (oldFlowUrl && oldFlowUrl !== flowUrl) {
            deleteFiles(oldFlowUrl)
          }
          // 同步本地记录的 flowUrl，使后续再次编辑提交时能正确清理本次上传的文件
          const rec = this.recordList.find(r => r.id === flow.bindTrbstId)
          if (rec) rec.flowUrl = flowUrl
          this.dirty = false
          this.flushDraft()
          ElMessage({ message: '流程提交成功', type: 'success' })
        } else {
          // 后端写入失败时回滚已上传的新文件，避免 OSS 残留
          deleteFiles(flowUrl)
          ElMessage({ message: (res.data && res.data.msg) || '流程提交失败', type: 'error' })
        }
      } catch (err) {
        // 上传阶段失败无文件需回滚；PUT 阶段异常时文件已上传，尝试回滚
        if (flowUrl) deleteFiles(flowUrl)
        ElMessage({ message: err.message || '流程提交失败', type: 'error' })
      } finally {
        this.submitting = false
      }
    },
    /** 提交文件名：flow_{名称}_{yyyyMMddHHmmss}.flow.json */
    submitFileName(flow) {
      const safeName = (flow.name || 'flow').replace(/[\\/:*?"<>|]/g, '_')
      const d = new Date()
      const p = n => String(n).padStart(2, '0')
      return `flow_${safeName}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.flow.json`
    },
    triggerImport() {
      this.$refs.importInput.click()
    },
    async handleImportFile(e) {
      const file = e.target.files[0]
      e.target.value = ''
      if (!file) return
      if (file.size > 5 * 1024 * 1024) {
        ElMessage({ message: '流程文件过大（>5M），请检查文件是否正确', type: 'error' })
        return
      }
      // 导入会整体覆盖当前画布，未导出的工作将丢失，需二次确认
      try {
        await ElMessageBox.confirm(
          '导入将覆盖当前画布内容（包括未导出的修改），确定继续？',
          '导入流程文件',
          { confirmButtonText: '导入', cancelButtonText: '取消', type: 'warning' }
        )
      } catch (e2) {
        return
      }
      let text
      try {
        text = await readFileText(file)
      } catch (err) {
        ElMessage({ message: err.message || '文件读取失败', type: 'error' })
        return
      }
      // 重新生成节点/连线 id 防冲突，保留流程级元信息
      const { flow, errors } = parseFlow(text, { regenerateIds: true })
      if (!flow) {
        ElMessage({ message: errors[0] || '流程文件解析失败', type: 'error' })
        return
      }
      if (errors.length > 0) {
        // 列出全部修正项，避免只看到第一条
        ElMessage({
          message: `导入完成，但有 ${errors.length} 处已自动修正：${errors.join('；')}`,
          type: 'warning',
          duration: 6000
        })
      } else {
        ElMessage({ message: '流程导入成功', type: 'success' })
      }
      this.loadFlow(flow)
    },

    // ====== 校验报告定位 ======
    locateNode(err) {
      if (!err.nodeId) return
      const node = this.vfNodes.find(n => n.id === err.nodeId)
      if (!node) return
      this.showReport = false
      this.selectedNodeId = node.id
      this.selectedEdgeId = null
      this.vfSetCenter(node.position.x + 95, node.position.y + 60, { zoom: 1.2, duration: 400 })
    }
  }
}
</script>

<style scoped>
.flow-builder {
  /* 面板宽度变量：全屏退出按钮定位需引用，避免遮挡属性面板操作 */
  --fb-panel-w: 280px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px - 48px);
  min-height: 540px;
  background: var(--oc-gray-50);
  border-radius: var(--oc-radius-md);
  overflow: hidden;
  border: var(--oc-card-border);
  box-shadow: var(--oc-shadow-sm);
}

/* ===== 顶部工具栏：白底 56px，按钮分组 + 竖分隔线 ===== */
.fb-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--oc-gray-200);
  background: var(--oc-bg-white);
  flex-shrink: 0;
  box-sizing: border-box;
}

.ship-select-wrap,
.record-select-wrap {
  display: flex;
  align-items: center;
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 分组内消除 el-button 相邻默认边距，统一由 gap 控制 */
.toolbar-group .el-button + .el-button {
  margin-left: 0;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--oc-gray-200);
  flex-shrink: 0;
}

/* ===== 主区域 ===== */
.fb-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 全屏编辑：整个工作区固定铺满视口 */
.fb-main.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: var(--oc-gray-50);
}

/* 全屏退出按钮：固定在画布右上角（右偏一个面板宽度），不遮挡右侧属性面板的删除节点按钮 */
.fb-exit-fullscreen {
  position: fixed;
  top: 16px;
  right: calc(var(--fb-panel-w) + 28px);
  z-index: 910;
  border-radius: var(--oc-radius-pill);
  box-shadow: var(--oc-shadow-lg);
}

/* 非全屏时的浮动全屏按钮：画布右上角，高于画布蒙层（z-10）保证始终可点 */
.fb-enter-fullscreen {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 11;
  border-radius: var(--oc-radius-pill);
  box-shadow: var(--oc-shadow-lg);
}

/* ===== 左侧组件面板（白卡） ===== */
.fb-palette {
  width: 156px;
  flex-shrink: 0;
  margin: 12px 0 12px 12px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: var(--oc-radius-md);
  overflow-y: auto;
}

.palette-title {
  margin: 0;
  font-size: var(--oc-text-sm);
  font-weight: 600;
  color: var(--oc-gray-900);
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-700);
  background: var(--oc-bg-white);
  border: 1px solid var(--oc-gray-200);
  border-radius: var(--oc-radius);
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.palette-item:not(.disabled):hover {
  border-color: var(--oc-blue-600);
  background: var(--oc-blue-50);
  color: var(--oc-blue-700);
}

.palette-item.disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.palette-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 与节点头部色条一致：start 绿 / step 蓝 / decision 紫 / end 灰 */
.palette-start .palette-dot { background: var(--oc-success); }
.palette-step .palette-dot { background: var(--oc-blue-600); }
.palette-decision .palette-dot { background: #8B5CF6; }
.palette-end .palette-dot { background: var(--oc-gray-500); }

.palette-hint {
  margin: 0;
  font-size: 11px;
  color: var(--oc-gray-400);
  line-height: 1.6;
}

/* ===== 画布 ===== */
.fb-canvas {
  flex: 1;
  position: relative;
  margin: 12px 0 12px 12px;
}

.vue-flow-canvas {
  width: 100%;
  height: 100%;
}

/* ===== 右侧属性面板（白卡） ===== */
.fb-panel {
  width: var(--fb-panel-w);
  flex-shrink: 0;
  margin: 12px;
  overflow-y: auto;
  padding: 16px;
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: var(--oc-radius-md);
  box-sizing: border-box;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px dashed var(--oc-gray-200);
}

.panel-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--oc-gray-900);
}

.field-label {
  font-size: var(--oc-text-sm);
  font-weight: 500;
  color: var(--oc-gray-700);
  margin-top: 6px;
}

.field-tip {
  margin: 4px 0 0;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
  line-height: 1.6;
}

.option-edit-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.option-input {
  flex: 1;
}

/* ===== 附件 ===== */
.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.photo-thumb {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: var(--oc-radius-sm);
  overflow: hidden;
  border: 1px solid var(--oc-gray-200);
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove {
  position: absolute;
  top: 0;
  right: 0;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  font-size: 12px;
  color: #fff;
  background: rgba(239, 68, 68, 0.9);
  cursor: pointer;
  border-radius: 0 6px 0 6px;
}

.photo-add {
  width: 56px;
  height: 56px;
  border: 1.5px dashed var(--oc-gray-300);
  border-radius: var(--oc-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--oc-gray-400);
  cursor: pointer;
  background: var(--oc-gray-50);
  transition: all 0.2s ease;
}

.photo-add:hover {
  color: var(--oc-blue-600);
  border-color: var(--oc-blue-400);
  background: var(--oc-blue-50);
}

.uploading-text {
  font-size: 14px;
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.doc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: var(--oc-gray-50);
  border-radius: var(--oc-radius-sm);
  border: 1px solid var(--oc-gray-200);
}

.doc-name {
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-700);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-remove {
  font-size: 14px;
  color: var(--oc-gray-400);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.doc-remove:hover {
  color: var(--oc-danger);
}

.edge-info {
  margin: 0;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-700);
  line-height: 1.6;
  word-break: break-all;
}

.meta-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-500);
  font-feature-settings: "tnum";
}

/* ===== 校验报告 ===== */
.report-ok {
  font-size: var(--oc-text-md);
  color: var(--oc-success);
  padding: 10px 0;
}

.report-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 320px;
  overflow-y: auto;
}

.report-item {
  padding: 8px 10px;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-700);
  border-bottom: 1px dashed var(--oc-gray-100);
  line-height: 1.6;
  border-radius: var(--oc-radius-sm);
}

.report-item.clickable {
  cursor: pointer;
}

.report-item.clickable:hover {
  background: var(--oc-blue-50);
}

.report-locate {
  font-size: var(--oc-text-xs);
  color: var(--oc-blue-600);
  margin-left: 6px;
}

/* ===== 画布未就绪蒙层：浅色留白 + 居中空状态 ===== */
.fb-canvas-mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 250, 252, 0.85);
  backdrop-filter: blur(2px);
}

.fb-canvas-placeholder {
  text-align: center;
  max-width: 360px;
  padding: 20px;
}

.placeholder-illustration {
  width: 120px;
  height: 90px;
  margin: 0 auto 16px;
}

.placeholder-illustration svg {
  width: 100%;
  height: 100%;
}

.placeholder-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 500;
  color: var(--oc-gray-700);
}

.placeholder-sub {
  margin: 0;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-400);
  line-height: 1.6;
}

/* ===== 媒体选择弹窗 ===== */
.picker-photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.picker-photo {
  position: relative;
  width: 92px;
  height: 92px;
  border: 2px solid var(--oc-gray-200);
  border-radius: var(--oc-radius);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.picker-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picker-photo:not(.duplicate):hover {
  border-color: var(--oc-blue-600);
}

.picker-photo.selected {
  border-color: var(--oc-blue-600);
  box-shadow: 0 0 0 2px var(--oc-blue-100);
}

.picker-photo.duplicate {
  cursor: not-allowed;
  opacity: 0.45;
}

.picker-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 1px 6px;
  font-size: 11px;
  color: #fff;
  border-radius: 10px;
  line-height: 1.4;
}

.picker-badge.sel {
  background: var(--oc-blue-600);
}

.picker-badge.dup {
  background: var(--oc-gray-400);
}

.picker-doc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-doc {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--oc-gray-200);
  border-radius: var(--oc-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.picker-doc:not(.duplicate):hover {
  border-color: var(--oc-blue-600);
  background: var(--oc-blue-50);
}

.picker-doc.selected {
  border-color: var(--oc-blue-600);
  background: var(--oc-blue-50);
}

.picker-doc.duplicate {
  cursor: not-allowed;
  opacity: 0.45;
}

.picker-doc-name {
  flex: 1;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-700);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-empty {
  margin: 0;
  padding: 24px 0;
  text-align: center;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-400);
}
</style>
