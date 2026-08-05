<template>
  <div class="flow-runner">
    <!-- 顶部：流程名 + 已走路径 -->
    <div class="runner-header">
      <div class="runner-title">
        <span class="flow-name">{{ flow.name }}</span>
        <span class="ship-tag" v-if="flow.shipName">{{ flow.shipName }}</span>
      </div>
      <div class="runner-breadcrumb" v-if="pathLabels.length > 0">
        <span class="crumb-label">已走路径：</span>
        <template v-for="(label, i) in pathLabels" :key="i">
          <span class="crumb-item">{{ label }}</span>
          <span class="crumb-sep" v-if="i < pathLabels.length - 1">→</span>
        </template>
      </div>
    </div>

    <!-- 当前节点卡片 -->
    <div class="runner-body" v-if="currentNode">
      <div class="node-type-row">
        <span class="node-type-badge" :class="'type-' + currentNode.type">
          {{ typeLabel }}
        </span>
        <span class="step-counter">第 {{ history.length + 1 }} 步</span>
      </div>

      <h3 class="node-title">{{ displayTitle }}</h3>
      <p class="node-desc" v-if="displayDescription">{{ displayDescription }}</p>

      <!-- 图片 -->
      <div class="media-photos" v-if="photos.length > 0">
        <el-image
          v-for="(url, i) in photos"
          :key="url + i"
          :src="url"
          :preview-src-list="photos"
          :initial-index="i"
          fit="cover"
          preview-teleported
          class="photo-item"
        />
      </div>

      <!-- 文档 -->
      <div class="media-docs" v-if="docs.length > 0">
        <a
          v-for="(url, i) in docs"
          :key="url + i"
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="doc-link"
        >
          <svg class="doc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          {{ docName(url, i) }}
        </a>
      </div>

      <!-- 操作区 -->
      <div class="runner-actions">
        <!-- 开始 / 步骤：单出口 -->
        <template v-if="currentNode.type === 'start' || currentNode.type === 'step'">
          <button class="btn-primary" @click="goNext">
            {{ currentNode.type === 'start' ? '开始排查' : '已完成，下一步' }}
          </button>
        </template>

        <!-- 判断：选项按钮 -->
        <template v-else-if="currentNode.type === 'decision'">
          <button
            v-for="opt in currentNode.options"
            :key="opt.id"
            class="btn-option"
            @click="chooseOption(opt)"
          >
            {{ opt.label }}
          </button>
        </template>

        <!-- 结束：结论 -->
        <template v-else-if="currentNode.type === 'end'">
          <div class="result-box" :class="{ resolved: currentNode.result && currentNode.result.resolved }">
            <div class="result-status">
              {{ currentNode.result && currentNode.result.resolved ? '✔ 问题已解决' : '✖ 问题未解决' }}
            </div>
            <p class="result-conclusion">{{ currentNode.result && currentNode.result.conclusion }}</p>
            <p class="result-suggestion" v-if="currentNode.result && currentNode.result.suggestion">
              建议：{{ currentNode.result.suggestion }}
            </p>
          </div>
          <button class="btn-primary" @click="restart">重新排查</button>
        </template>
      </div>
    </div>

    <!-- 数据异常 -->
    <div class="runner-body runner-error" v-else>
      <p>流程数据异常：未找到当前节点，请检查流程文件。</p>
      <button class="btn-primary" @click="restart">回到开始</button>
    </div>

    <!-- 底部 -->
    <div class="runner-footer">
      <button class="btn-text" :disabled="history.length === 0" @click="goBack">← 上一步</button>
      <button class="btn-text" @click="restart">重新开始</button>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { getStartNode, getOutEdges, getNodeById } from '@/utils/flowSchema'

export default {
  name: 'FlowRunner',
  props: {
    // 流程对象（符合 flowSchema 结构）
    flow: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      currentId: null,
      // 历史栈：{ nodeId, viaLabel } viaLabel 为进入下一节点时的选项/动作文字
      history: []
    }
  },
  computed: {
    currentNode() {
      return this.currentId ? getNodeById(this.flow, this.currentId) : null
    },
    typeLabel() {
      const map = { start: '开始', step: '步骤', decision: '判断', end: '结束' }
      return this.currentNode ? map[this.currentNode.type] : ''
    },
    displayTitle() {
      if (!this.currentNode) return ''
      if (this.currentNode.type === 'decision') {
        return this.currentNode.question || this.currentNode.label || '请选择'
      }
      return this.currentNode.label || this.typeLabel
    },
    displayDescription() {
      return this.currentNode ? this.currentNode.description : ''
    },
    photos() {
      return (this.currentNode && this.currentNode.media && this.currentNode.media.photos) || []
    },
    docs() {
      return (this.currentNode && this.currentNode.media && this.currentNode.media.docs) || []
    },
    pathLabels() {
      return this.history.map(h => h.viaLabel)
    }
  },
  watch: {
    flow: {
      immediate: true,
      handler() {
        this.restart()
      }
    }
  },
  methods: {
    restart() {
      const start = getStartNode(this.flow)
      this.currentId = start ? start.id : null
      this.history = []
    },
    /** 沿唯一出边前进（start / step） */
    goNext() {
      const edges = getOutEdges(this.flow, this.currentId)
      if (edges.length === 0) {
        ElMessage({ message: '流程数据异常：当前节点缺少下一步，请联系流程维护者', type: 'error' })
        return
      }
      this.jumpTo(edges[0].target, this.currentNode.type === 'start' ? '开始' : '完成')
    },
    /** 判断节点：按选项找 edge 跳转 */
    chooseOption(opt) {
      const edges = getOutEdges(this.flow, this.currentId, opt.id)
      if (edges.length === 0) {
        ElMessage({ message: '流程数据异常：该选项未配置后续步骤，请联系流程维护者', type: 'error' })
        return
      }
      this.jumpTo(edges[0].target, opt.label)
    },
    jumpTo(targetId, viaLabel) {
      this.history.push({ nodeId: this.currentId, viaLabel })
      this.currentId = targetId
    },
    goBack() {
      const prev = this.history.pop()
      if (prev) {
        this.currentId = prev.nodeId
      }
    },
    docName(url, index) {
      try {
        const seg = decodeURIComponent(url.split('/').pop() || '')
        return seg || `文档 ${index + 1}`
      } catch (e) {
        return `文档 ${index + 1}`
      }
    }
  }
}
</script>

<style scoped>
.flow-runner {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: var(--oc-text-md);
  color: var(--oc-gray-900);
}

.runner-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.runner-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flow-name {
  font-size: var(--oc-text-lg);
  font-weight: 600;
}

.ship-tag {
  font-size: var(--oc-text-xs);
  color: var(--oc-blue-700);
  background: var(--oc-blue-50);
  border-radius: var(--oc-radius-sm);
  padding: 2px 8px;
}

.runner-breadcrumb {
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-500);
  line-height: 1.6;
}

.crumb-label {
  color: var(--oc-gray-400);
}

.crumb-sep {
  margin: 0 4px;
  color: var(--oc-gray-300);
}

.runner-body {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
}

.runner-error {
  color: var(--oc-danger);
}

.node-type-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.node-type-badge {
  font-size: var(--oc-text-xs);
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 10px;
  color: #fff;
}

/* 与 FlowNode 头部色条一致：start 绿 / step 蓝 / decision 紫 / end 灰 */
.node-type-badge.type-start { background: var(--oc-success); }
.node-type-badge.type-step { background: var(--oc-blue-600); }
.node-type-badge.type-decision { background: #8B5CF6; }
.node-type-badge.type-end { background: var(--oc-gray-500); }

.step-counter {
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
  font-feature-settings: "tnum";
}

.node-title {
  margin: 0 0 8px;
  font-size: var(--oc-text-lg);
  font-weight: 600;
  color: var(--oc-gray-900);
}

.node-desc {
  margin: 0 0 12px;
  font-size: var(--oc-text-sm);
  line-height: 1.7;
  color: var(--oc-gray-700);
  white-space: pre-wrap;
}

.media-photos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.photo-item {
  width: 88px;
  height: 88px;
  border-radius: var(--oc-radius);
  border: 1px solid var(--oc-gray-200);
  cursor: zoom-in;
}

.media-docs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.doc-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--oc-text-sm);
  color: var(--oc-blue-600);
  text-decoration: none;
}

.doc-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.doc-link:hover {
  text-decoration: underline;
}

.runner-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

.btn-primary {
  padding: 10px 18px;
  font-size: var(--oc-text-md);
  font-weight: 500;
  color: #fff;
  background: var(--oc-blue-600);
  border: none;
  border-radius: var(--oc-radius);
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: var(--oc-blue-700);
}

.btn-option {
  padding: 12px 16px;
  font-size: var(--oc-text-md);
  text-align: left;
  color: var(--oc-gray-700);
  background: var(--oc-gray-50);
  border: 1px solid var(--oc-gray-200);
  border-radius: var(--oc-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-option:hover {
  background: var(--oc-blue-50);
  border-color: var(--oc-blue-600);
  color: var(--oc-blue-700);
}

.result-box {
  border-radius: var(--oc-radius);
  padding: 14px 16px;
  background: var(--oc-danger-bg);
  border: 1px solid #FECACA;
}

.result-box.resolved {
  background: var(--oc-success-bg);
  border-color: #A7F3D0;
}

.result-status {
  font-size: var(--oc-text-md);
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--oc-danger);
}

.result-box.resolved .result-status {
  color: var(--oc-success);
}

.result-conclusion {
  margin: 0;
  font-size: var(--oc-text-sm);
  line-height: 1.7;
  color: var(--oc-gray-700);
  white-space: pre-wrap;
}

.result-suggestion {
  margin: 8px 0 0;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-500);
  white-space: pre-wrap;
}

.runner-footer {
  display: flex;
  justify-content: space-between;
}

.btn-text {
  background: none;
  border: none;
  font-size: var(--oc-text-sm);
  color: var(--oc-blue-600);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--oc-radius-sm);
  transition: all 0.2s ease;
}

.btn-text:disabled {
  color: var(--oc-gray-300);
  cursor: not-allowed;
}

.btn-text:not(:disabled):hover {
  color: var(--oc-blue-700);
  background: var(--oc-blue-50);
}
</style>
