// 故障排查流程（flow.json）数据结构工具
// 约定：
// - 顶层：version / id / name / shipId / shipName / bindTrbstId / description / author / createTime / updateTime / canvas / nodes[] / edges[]
// - 节点：公共字段 id/type/label/description/position/media{photos[],docs[]}
//         decision 额外 question/options[{id,label}]；end 额外 result{resolved,conclusion,suggestion}
// - 连线：id/source/target/sourceOption(decision 分支必填)/label
// - 跳转关系全部由 edges 表达，节点内部不存目标 id，画布与 Runner 共用同一份数据

export const FLOW_VERSION = '1.0.0'

export const NODE_TYPES = ['start', 'step', 'decision', 'end']

export const NODE_TYPE_META = {
  start: { label: '开始', color: '#10B981' },
  step: { label: '步骤', color: '#2563EB' },
  decision: { label: '判断', color: '#8B5CF6' },
  end: { label: '结束', color: '#64748B' }
}

let idSeq = 0

/** 生成节点/连线/选项唯一 id（时间戳 + 随机 + 自增，导入重生成场景也足够唯一） */
export function genId(prefix = 'n') {
  idSeq = (idSeq + 1) % 10000
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}${idSeq.toString(36)}`
}

/** 创建指定类型的空白节点 */
export function createNode(type, position = { x: 0, y: 0 }) {
  if (!NODE_TYPES.includes(type)) {
    throw new Error(`未知节点类型: ${type}`)
  }
  const node = {
    id: genId('n'),
    type,
    label: NODE_TYPE_META[type].label,
    description: '',
    position: { x: position.x || 0, y: position.y || 0 },
    media: { photos: [], docs: [] }
  }
  if (type === 'decision') {
    node.question = ''
    node.options = [
      { id: genId('opt'), label: '是' },
      { id: genId('opt'), label: '否' }
    ]
  }
  if (type === 'end') {
    node.result = { resolved: true, conclusion: '', suggestion: '' }
  }
  return node
}

/** 创建空流程对象 */
export function createFlow(overrides = {}) {
  const now = formatTime(new Date())
  const start = createNode('start', { x: 80, y: 160 })
  start.label = '开始'
  return {
    version: FLOW_VERSION,
    id: genId('flow'),
    name: '未命名排查流程',
    shipId: null,
    shipName: '',
    bindTrbstId: null,
    description: '',
    author: '',
    createTime: now,
    updateTime: now,
    canvas: { zoom: 1, offsetX: 0, offsetY: 0 },
    nodes: [start],
    edges: [],
    ...overrides
  }
}

export function formatTime(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 归一化单个节点：补默认字段、剔除非法值（导入时使用，不抛错，收集到 errors） */
function normalizeNode(raw, errors, index) {
  if (!raw || typeof raw !== 'object') {
    errors.push(`nodes[${index}] 不是合法对象`)
    return null
  }
  if (!raw.id || typeof raw.id !== 'string') {
    errors.push(`nodes[${index}] 缺少 id`)
    return null
  }
  if (!NODE_TYPES.includes(raw.type)) {
    errors.push(`节点 ${raw.id} 类型非法: ${raw.type}`)
    return null
  }
  const node = {
    id: raw.id,
    type: raw.type,
    label: typeof raw.label === 'string' ? raw.label : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    position: {
      x: Number(raw.position && raw.position.x) || 0,
      y: Number(raw.position && raw.position.y) || 0
    },
    media: {
      photos: Array.isArray(raw.media && raw.media.photos) ? raw.media.photos.filter(u => typeof u === 'string') : [],
      docs: Array.isArray(raw.media && raw.media.docs) ? raw.media.docs.filter(u => typeof u === 'string') : []
    }
  }
  if (raw.type === 'decision') {
    node.question = typeof raw.question === 'string' ? raw.question : ''
    const opts = Array.isArray(raw.options) ? raw.options : []
    node.options = opts
      .filter(o => o && typeof o.id === 'string' && typeof o.label === 'string')
      .map(o => ({ id: o.id, label: o.label }))
    if (node.options.length !== opts.length) {
      errors.push(`判断节点 ${raw.id} 存在非法选项，已剔除`)
    }
  }
  if (raw.type === 'end') {
    const r = raw.result && typeof raw.result === 'object' ? raw.result : {}
    node.result = {
      resolved: r.resolved !== false,
      conclusion: typeof r.conclusion === 'string' ? r.conclusion : '',
      suggestion: typeof r.suggestion === 'string' ? r.suggestion : ''
    }
  }
  return node
}

/**
 * 解析并校验导入的 flow JSON 文本。
 * @param {string} text 文件文本
 * @param {object} [opts] { regenerateIds: boolean } 是否重新生成所有 id（防冲突）
 * @returns {{ flow: object|null, errors: string[] }}
 */
export function parseFlow(text, opts = {}) {
  const errors = []
  let raw
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { flow: null, errors: [`JSON 解析失败：${e.message}`] }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { flow: null, errors: ['文件内容不是合法的流程对象'] }
  }
  if (!raw.version) {
    errors.push('缺少 version 字段，无法确认结构版本')
  } else if (String(raw.version).split('.')[0] !== FLOW_VERSION.split('.')[0]) {
    return { flow: null, errors: [`结构主版本不兼容：文件为 ${raw.version}，当前支持 ${FLOW_VERSION}`] }
  }
  if (!Array.isArray(raw.nodes) || raw.nodes.length === 0) {
    return { flow: null, errors: ['nodes 缺失或为空'] }
  }
  if (!Array.isArray(raw.edges)) {
    errors.push('edges 缺失，已按空数组处理')
  }

  // 按 id 去重（保留首个），重复 id 会导致画布渲染与连线引用错乱
  const seenNodeIds = new Set()
  const nodes = []
  raw.nodes.forEach((n, i) => {
    const node = normalizeNode(n, errors, i)
    if (!node) return
    if (seenNodeIds.has(node.id)) {
      errors.push(`节点 ${node.id} 重复，已保留首个并剔除后续重复项`)
      return
    }
    seenNodeIds.add(node.id)
    nodes.push(node)
  })

  const nodeIds = new Set(nodes.map(n => n.id))
  const optionIds = new Set()
  const decisionOptionMap = {}
  nodes.forEach(n => {
    if (n.type === 'decision') {
      decisionOptionMap[n.id] = new Set()
      n.options.forEach(o => {
        if (optionIds.has(o.id)) errors.push(`存在重复选项 id: ${o.id}`)
        optionIds.add(o.id)
        decisionOptionMap[n.id].add(o.id)
      })
    }
  })

  const edges = (Array.isArray(raw.edges) ? raw.edges : [])
    .map((e, i) => {
      if (!e || typeof e !== 'object') {
        errors.push(`edges[${i}] 不是合法对象`)
        return null
      }
      if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) {
        errors.push(`连线 ${e.id || `edges[${i}]`} 引用了不存在的节点，已剔除`)
        return null
      }
      // 判断节点出边的 sourceOption 必须指向其真实存在的选项，否则视为悬空连线剔除
      if (e.sourceOption != null && decisionOptionMap[e.source] && !decisionOptionMap[e.source].has(e.sourceOption)) {
        errors.push(`连线 ${e.id || `edges[${i}]`} 的分支选项不存在，已剔除`)
        return null
      }
      return {
        id: typeof e.id === 'string' ? e.id : genId('e'),
        source: e.source,
        sourceOption: typeof e.sourceOption === 'string' ? e.sourceOption : null,
        target: e.target,
        label: typeof e.label === 'string' ? e.label : ''
      }
    })
    .filter(Boolean)

  const flow = {
    version: FLOW_VERSION,
    id: typeof raw.id === 'string' ? raw.id : genId('flow'),
    name: typeof raw.name === 'string' && raw.name ? raw.name : '未命名排查流程',
    shipId: raw.shipId == null ? null : raw.shipId,
    shipName: typeof raw.shipName === 'string' ? raw.shipName : '',
    bindTrbstId: raw.bindTrbstId == null ? null : raw.bindTrbstId,
    description: typeof raw.description === 'string' ? raw.description : '',
    author: typeof raw.author === 'string' ? raw.author : '',
    createTime: typeof raw.createTime === 'string' ? raw.createTime : formatTime(new Date()),
    updateTime: typeof raw.updateTime === 'string' ? raw.updateTime : formatTime(new Date()),
    canvas: {
      zoom: Number(raw.canvas && raw.canvas.zoom) || 1,
      offsetX: Number(raw.canvas && raw.canvas.offsetX) || 0,
      offsetY: Number(raw.canvas && raw.canvas.offsetY) || 0
    },
    nodes,
    edges
  }

  if (opts.regenerateIds) {
    remapIds(flow)
  }
  return { flow, errors }
}

/** 重新生成流程内所有 id，并保持 edges/options 引用一致 */
export function remapIds(flow) {
  const nodeIdMap = {}
  const optIdMap = {}
  flow.id = genId('flow')
  flow.nodes.forEach(n => {
    const nid = genId('n')
    nodeIdMap[n.id] = nid
    n.id = nid
    if (n.type === 'decision') {
      n.options.forEach(o => {
        const oid = genId('opt')
        optIdMap[o.id] = oid
        o.id = oid
      })
    }
  })
  flow.edges.forEach(e => {
    e.id = genId('e')
    e.source = nodeIdMap[e.source]
    e.target = nodeIdMap[e.target]
    if (e.sourceOption) e.sourceOption = optIdMap[e.sourceOption] || null
  })
}

/**
 * 业务规则校验（保存/导出/预览/提交前执行）。
 * @param {object} flow 流程对象
 * @param {object} [opts] { requireBindTrbst: boolean } 提交场景下要求必须绑定故障排查记录
 * @returns {{ valid: boolean, errors: Array<{ nodeId?: string, message: string }> }}
 */
export function validateFlow(flow, opts = {}) {
  const errors = []
  if (!flow || !Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) {
    return { valid: false, errors: [{ message: '流程数据不完整' }] }
  }
  const { nodes, edges } = flow
  const byId = {}
  nodes.forEach(n => { byId[n.id] = n })

  if (!flow.name || !flow.name.trim()) {
    errors.push({ message: '流程名称不能为空' })
  }

  if (flow.shipId === null || flow.shipId === undefined || flow.shipId === '') {
    errors.push({ message: '请先选择关联船型' })
  }

  // 提交到后端前必须绑定故障排查记录（导出/预览不强制）
  if (opts.requireBindTrbst && (flow.bindTrbstId === null || flow.bindTrbstId === undefined)) {
    errors.push({ message: '提交前必须在顶部选择关联的故障排查记录' })
  }

  const starts = nodes.filter(n => n.type === 'start')
  if (starts.length === 0) errors.push({ message: '缺少开始节点' })
  if (starts.length > 1) errors.push({ message: '开始节点必须恰好 1 个，当前有 ' + starts.length + ' 个' })

  // 开始节点是流程入口，不允许有入边
  if (starts.length > 0) {
    const startIds = new Set(starts.map(n => n.id))
    edges.forEach(e => {
      if (startIds.has(e.target)) {
        errors.push({ nodeId: e.target, message: `开始节点「${byId[e.target].label || e.target}」不应有入边（连线 ${e.id}）` })
      }
    })
  }

  const ends = nodes.filter(n => n.type === 'end')
  if (ends.length === 0) errors.push({ message: '至少需要 1 个结束节点' })

  // 出边统计
  const outEdges = {}
  edges.forEach(e => {
    if (!outEdges[e.source]) outEdges[e.source] = []
    outEdges[e.source].push(e)
  })

  nodes.forEach(n => {
    const outs = outEdges[n.id] || []
    if (n.type === 'start' || n.type === 'step') {
      if (outs.length !== 1) {
        errors.push({ nodeId: n.id, message: `「${n.label || n.id}」(${NODE_TYPE_META[n.type].label}) 应有且仅有 1 条出边，当前 ${outs.length} 条` })
      }
      if (n.type === 'step' && !n.label.trim()) {
        errors.push({ nodeId: n.id, message: `步骤节点 ${n.id} 标题不能为空` })
      }
    }
    if (n.type === 'decision') {
      if (!n.question || !n.question.trim()) {
        errors.push({ nodeId: n.id, message: `判断节点「${n.label || n.id}」的问题不能为空` })
      }
      if (!Array.isArray(n.options) || n.options.length < 2) {
        errors.push({ nodeId: n.id, message: `判断节点「${n.label || n.id}」至少需要 2 个选项` })
      } else {
        n.options.forEach(o => {
          if (!o.label.trim()) {
            errors.push({ nodeId: n.id, message: `判断节点「${n.label || n.id}」存在空白选项` })
          }
          const linked = outs.some(e => e.sourceOption === o.id)
          if (!linked) {
            errors.push({ nodeId: n.id, message: `判断节点「${n.label || n.id}」的选项「${o.label}」尚未连线` })
          }
        })
        // 判断节点的出边必须挂在真实存在的选项上
        const optionIdSet = new Set(n.options.map(o => o.id))
        outs.forEach(e => {
          if (!e.sourceOption) {
            errors.push({ nodeId: n.id, message: `判断节点「${n.label || n.id}」存在未绑定选项的连线` })
          } else if (!optionIdSet.has(e.sourceOption)) {
            errors.push({ nodeId: n.id, message: `判断节点「${n.label || n.id}」的连线 ${e.id} 指向了不存在的选项，请删除后重新连接` })
          }
        })
      }
    }
    if (n.type === 'end') {
      if (outs.length > 0) {
        errors.push({ nodeId: n.id, message: `结束节点「${n.label || n.id}」不应有出边` })
      }
      if (!n.result || !n.result.conclusion || !n.result.conclusion.trim()) {
        errors.push({ nodeId: n.id, message: `结束节点「${n.label || n.id}」的结论文本不能为空` })
      }
    }
  })

  // 悬空连线与自环连线
  edges.forEach(e => {
    if (!byId[e.source] || !byId[e.target]) {
      errors.push({ message: `连线 ${e.id} 引用了不存在的节点` })
    } else if (e.source === e.target) {
      errors.push({ nodeId: e.source, message: `「${byId[e.source].label || e.source}」存在指向自身的连线（${e.id}），请删除` })
    }
  })

  // 可达性：从开始节点 BFS，所有节点必须可达
  if (starts.length === 1) {
    const visited = new Set([starts[0].id])
    const queue = [starts[0].id]
    while (queue.length) {
      const cur = queue.shift()
      ;(outEdges[cur] || []).forEach(e => {
        if (!visited.has(e.target)) {
          visited.add(e.target)
          queue.push(e.target)
        }
      })
    }
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        errors.push({ nodeId: n.id, message: `节点「${n.label || n.id}」从开始节点不可达（孤儿节点）` })
      }
    })
  }

  return { valid: errors.length === 0, errors }
}

/** 导出流程为 .json 文件下载（导出前请先用 validateFlow 校验） */
export function downloadFlow(flow) {
  flow.updateTime = formatTime(new Date())
  const text = JSON.stringify(flow, null, 2)
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = (flow.name || 'flow').replace(/[\\/:*?"<>|]/g, '_')
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  a.href = url
  a.download = `flow_${safeName}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 读取本地文件文本 */
export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}

/** 获取流程的开始节点 */
export function getStartNode(flow) {
  return flow.nodes.find(n => n.type === 'start') || null
}

/** 获取某节点出边；decision 可按 optionId 过滤 */
export function getOutEdges(flow, nodeId, optionId = null) {
  return flow.edges.filter(e => e.source === nodeId && (optionId === null || e.sourceOption === optionId))
}

/** 按 id 取节点 */
export function getNodeById(flow, nodeId) {
  return flow.nodes.find(n => n.id === nodeId) || null
}
