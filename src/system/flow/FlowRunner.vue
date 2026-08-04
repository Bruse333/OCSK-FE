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
          📄 {{ docName(url, i) }}
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
  font-size: 14px;
  color: #1a3a6e;
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
  font-size: 16px;
  font-weight: 600;
}

.ship-tag {
  font-size: 12px;
  color: #1a5fb4;
  background: #e6f1fb;
  border-radius: 4px;
  padding: 2px 8px;
}

.runner-breadcrumb {
  font-size: 12px;
  color: #6b7a99;
  line-height: 1.6;
}

.crumb-label {
  color: #9aa7bd;
}

.crumb-sep {
  margin: 0 4px;
  color: #b8c2d4;
}

.runner-body {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
}

.runner-error {
  color: #ed4014;
}

.node-type-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.node-type-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  color: #fff;
}

.node-type-badge.type-start { background: #3584e4; }
.node-type-badge.type-step { background: #19be6b; }
.node-type-badge.type-decision { background: #ff9900; }
.node-type-badge.type-end { background: #ed4014; }

.step-counter {
  font-size: 12px;
  color: #9aa7bd;
}

.node-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1a3a6e;
}

.node-desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.7;
  color: #46587a;
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
  border-radius: 8px;
  border: 1px solid #e3eaf5;
  cursor: zoom-in;
}

.media-docs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.doc-link {
  font-size: 13px;
  color: #1a5fb4;
  text-decoration: none;
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
  font-size: 14px;
  color: #fff;
  background: #3584e4;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1a5fb4;
}

.btn-option {
  padding: 12px 16px;
  font-size: 14px;
  text-align: left;
  color: #1a3a6e;
  background: #f5f7fa;
  border: 1px solid #d0dff0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-option:hover {
  background: #e6f1fb;
  border-color: #3584e4;
}

.result-box {
  border-radius: 8px;
  padding: 14px 16px;
  background: #fdf0ee;
  border: 1px solid #f2c1bb;
}

.result-box.resolved {
  background: #ecf9f1;
  border-color: #a9e4c3;
}

.result-status {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #ed4014;
}

.result-box.resolved .result-status {
  color: #19be6b;
}

.result-conclusion {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #46587a;
  white-space: pre-wrap;
}

.result-suggestion {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7a99;
  white-space: pre-wrap;
}

.runner-footer {
  display: flex;
  justify-content: space-between;
}

.btn-text {
  background: none;
  border: none;
  font-size: 13px;
  color: #3584e4;
  cursor: pointer;
  padding: 4px 8px;
}

.btn-text:disabled {
  color: #b8c2d4;
  cursor: not-allowed;
}

.btn-text:not(:disabled):hover {
  color: #1a5fb4;
}
</style>
