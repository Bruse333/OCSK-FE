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
      <div class="node-media-hint" v-if="mediaCount > 0">
        <svg class="media-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
        {{ mediaCount }} 个附件
      </div>
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
  background: var(--oc-bg-white);
  border: 1.5px solid var(--oc-gray-200);
  border-radius: 10px;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-700);
  box-shadow: var(--oc-shadow-sm);
  overflow: visible;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.flow-node.selected {
  border-color: var(--oc-blue-600);
  box-shadow: 0 0 0 3px var(--oc-blue-100), var(--oc-shadow-sm);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-bottom: 1px solid var(--oc-gray-100);
  border-radius: 9px 9px 0 0;
}

/* 四类节点头部色条：start 绿 / step 蓝 / decision 紫 / end 灰 */
.header-start { background: var(--oc-success-bg); }
.header-step { background: var(--oc-blue-50); }
.header-decision { background: #F5F3FF; }
.header-end { background: var(--oc-gray-100); }

.node-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.header-start .node-type-dot { background: var(--oc-success); }
.header-step .node-type-dot { background: var(--oc-blue-600); }
.header-decision .node-type-dot { background: #8B5CF6; }
.header-end .node-type-dot { background: var(--oc-gray-500); }

.node-type-name {
  font-size: 11px;
  font-weight: 600;
}

.header-start .node-type-name { color: #047857; }
.header-step .node-type-name { color: var(--oc-blue-700); }
.header-decision .node-type-name { color: #6D28D9; }
.header-end .node-type-name { color: var(--oc-gray-500); }

.node-body {
  padding: 8px 10px;
}

.node-title {
  font-size: var(--oc-text-sm);
  font-weight: 600;
  color: var(--oc-gray-900);
  line-height: 1.4;
  word-break: break-all;
}

.node-desc {
  margin-top: 4px;
  font-size: 11px;
  color: var(--oc-gray-500);
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
  color: var(--oc-gray-400);
}

.node-media-hint {
  display: flex;
  align-items: center;
  gap: 3px;
}

.media-icon {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
}

.option-rows {
  border-top: 1px solid var(--oc-gray-100);
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
  font-size: var(--oc-text-xs);
  color: #6D28D9;
  background: #F5F3FF;
  border-radius: var(--oc-radius-sm);
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
  border: 2px solid var(--oc-blue-600);
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
  border-color: #8B5CF6;
}
</style>
