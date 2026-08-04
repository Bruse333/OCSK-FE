<template>
  <div class="flow-node" :class="['node-' + data.nodeType, { selected: selected }]">
    <!-- 入边锚点（开始节点无入边） -->
    <Handle
      v-if="data.nodeType !== 'start'"
      id="in"
      type="target"
      :position="Position.Left"
      class="handle handle-in"
    />

    <div class="node-header" :class="'header-' + data.nodeType">
      <span class="node-type-dot"></span>
      <span class="node-type-name">{{ typeName }}</span>
    </div>
    <div class="node-body">
      <div class="node-title">{{ displayTitle }}</div>
      <div class="node-desc" v-if="data.description">{{ data.description }}</div>
      <div class="node-media-hint" v-if="mediaCount > 0">📎 {{ mediaCount }} 个附件</div>
      <div class="node-result-hint" v-if="data.nodeType === 'end' && data.result">
        {{ data.result.resolved ? '✔ 已解决' : '✖ 未解决' }}
      </div>
    </div>

    <!-- 出边锚点：start / step 单出口 -->
    <Handle
      v-if="data.nodeType === 'start' || data.nodeType === 'step'"
      id="out"
      type="source"
      :position="Position.Right"
      class="handle handle-out"
    />

    <!-- 出边锚点：decision 每个选项一个 -->
    <div v-if="data.nodeType === 'decision'" class="option-rows">
      <div v-for="opt in data.options" :key="opt.id" class="option-row">
        <span class="option-label">{{ opt.label }}</span>
        <Handle
          :id="opt.id"
          type="source"
          :position="Position.Right"
          class="handle handle-option"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { Handle, Position } from '@vue-flow/core'

export default {
  name: 'FlowNode',
  components: { Handle },
  props: {
    // Vue Flow 注入：节点数据（业务字段都在 data 上）
    data: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    Position() {
      return Position
    },
    typeName() {
      const map = { start: '开始', step: '步骤', decision: '判断', end: '结束' }
      return map[this.data.nodeType] || ''
    },
    displayTitle() {
      if (this.data.nodeType === 'decision') {
        return this.data.question || this.data.label || '未命名判断'
      }
      return this.data.label || this.typeName
    },
    mediaCount() {
      const m = this.data.media || {}
      return (m.photos ? m.photos.length : 0) + (m.docs ? m.docs.length : 0)
    }
  }
}
</script>

<style scoped>
.flow-node {
  width: 190px;
  background: #fff;
  border: 1.5px solid #d0dff0;
  border-radius: 10px;
  font-size: 12px;
  color: #1a3a6e;
  overflow: visible;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.flow-node.selected {
  border-color: #3584e4;
  box-shadow: 0 0 0 3px rgba(53, 132, 228, 0.18);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-bottom: 1px solid #edf1f7;
  border-radius: 9px 9px 0 0;
}

.node-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.header-start .node-type-dot { background: #3584e4; }
.header-step .node-type-dot { background: #19be6b; }
.header-decision .node-type-dot { background: #ff9900; }
.header-end .node-type-dot { background: #ed4014; }

.node-type-name {
  font-size: 11px;
  color: #6b7a99;
}

.node-body {
  padding: 8px 10px;
}

.node-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-all;
}

.node-desc {
  margin-top: 4px;
  font-size: 11px;
  color: #6b7a99;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.node-media-hint,
.node-result-hint {
  margin-top: 4px;
  font-size: 11px;
  color: #9aa7bd;
}

.option-rows {
  border-top: 1px solid #edf1f7;
  padding: 4px 0 6px;
}

.option-row {
  position: relative;
  display: flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
}

.option-label {
  font-size: 12px;
  color: #b36b00;
  background: #fdf3e3;
  border-radius: 4px;
  padding: 1px 8px;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.handle {
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid #3584e4;
}

.handle-in {
  left: -6px;
}

.handle-out {
  right: -6px;
}

.handle-option {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-color: #ff9900;
}
</style>
