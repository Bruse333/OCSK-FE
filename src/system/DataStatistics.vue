<template>
  <div class="data-statistics-page">
    <div class="page-header">
      <h2 class="page-title">故障记录统计</h2>
      <p class="page-subtitle">按船型统计故障记录分布情况</p>
    </div>

    <!-- 顶部统计卡行 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-card-label"><span class="stat-dot dot-blue"></span>故障记录总数</div>
        <div class="stat-card-num">{{ totalCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label"><span class="stat-dot dot-cyan"></span>覆盖船型数</div>
        <div class="stat-card-num">{{ shipCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label"><span class="stat-dot dot-amber"></span>单船型最多记录</div>
        <div class="stat-card-num">{{ maxCount }}</div>
      </div>
    </div>

    <!-- 图表卡：环形图 + 右侧纵向图例（图表容器常驻，空状态绝对覆盖，保证 echarts 实例稳定） -->
    <div class="chart-card">
      <div class="chart-wrap">
        <div ref="chartRef" class="chart-container"></div>
        <!-- 环形图中心总数 -->
        <div class="donut-center" v-if="!isEmpty">
          <span class="donut-total">{{ totalCount }}</span>
          <span class="donut-label">故障记录</span>
        </div>
      </div>
      <div class="legend-list" v-if="!isEmpty">
        <div class="legend-item" v-for="item in legendItems" :key="item.name">
          <span class="legend-dot" :style="{ background: item.color }"></span>
          <span class="legend-name">{{ item.name }}</span>
          <span class="legend-value">{{ item.value }}</span>
          <span class="legend-percent">{{ item.percent }}%</span>
        </div>
      </div>

      <!-- 空状态覆盖层 -->
      <div class="empty-overlay" v-if="isEmpty">
        <div class="empty-illustration">
          <svg viewBox="0 0 120 120" fill="none">
            <rect x="28" y="20" width="48" height="60" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2.5"/>
            <line x1="38" y1="34" x2="66" y2="34" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="38" y1="44" x2="66" y2="44" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="38" y1="54" x2="56" y2="54" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="72" cy="66" r="16" fill="#fff" stroke="#93C5FD" stroke-width="3"/>
            <line x1="83" y1="77" x2="94" y2="88" stroke="#93C5FD" stroke-width="3.5" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="empty-title">暂无统计数据</p>
        <p class="empty-sub">添加排查记录后，这里将展示按船型的分布统计</p>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

// 图表色板（categorical）
const CHART_PALETTE = ['#2563EB', '#06B6D4', '#8B5CF6', '#F59E0B', '#10B981', '#F97316', '#EC4899', '#64748B']

export default {
  name: 'DataStatisticsPage',
  data() {
    return {
      chart: null,
      isEmpty: false,
      totalCount: 0,
      shipCount: 0,
      maxCount: 0,
      legendItems: []
    }
  },
  mounted() {
    this.initChart()
    this.fetchData()
    window.addEventListener('resize', this.handleResize)
  },
  activated() {
    this.fetchData()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartRef)
    },
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    },
    async fetchData() {
      try {
        this.chart && this.chart.showLoading({
          text: '加载中...',
          color: '#2563EB',
          textColor: '#64748B',
          maskColor: 'rgba(255, 255, 255, 0.8)'
        })
        const res = await request.get('/reports/trbstCount')
        if (res.data.code === 1) {
          const data = res.data.data || []
          if (data.length === 0) {
            this.isEmpty = true
            this.totalCount = 0
            this.shipCount = 0
            this.maxCount = 0
            this.legendItems = []
            this.chart && this.chart.hideLoading()
            return
          }
          this.isEmpty = false
          this.renderChart(data)
        } else {
          ElMessage({
            message: res.data.msg || '获取统计数据失败',
            type: 'error'
          })
          this.chart && this.chart.hideLoading()
        }
      } catch (err) {
        console.error('获取统计数据失败:', err)
        ElMessage({
          message: '获取统计数据失败',
          type: 'error'
        })
        this.chart && this.chart.hideLoading()
      }
    },
    renderChart(data) {
      if (!this.chart) return
      const total = data.reduce((sum, item) => sum + (item.value || 0), 0)
      // 统计卡数据 + 右侧图例数据（全部由接口数据前端计算）
      this.totalCount = total
      this.shipCount = data.length
      this.maxCount = data.reduce((max, item) => Math.max(max, item.value || 0), 0)
      this.legendItems = data.map((item, i) => ({
        name: item.name,
        value: item.value || 0,
        percent: total > 0 ? ((item.value || 0) / total * 100).toFixed(1) : '0.0',
        color: CHART_PALETTE[i % CHART_PALETTE.length]
      }))
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)',
          backgroundColor: '#FFFFFF',
          borderWidth: 0,
          textStyle: {
            color: '#334155',
            fontSize: 13
          },
          extraCssText: 'border-radius: 8px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12); padding: 8px 12px;'
        },
        color: CHART_PALETTE,
        series: [
          {
            name: '故障记录',
            type: 'pie',
            radius: ['55%', '78%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false
            },
            labelLine: {
              show: false
            },
            emphasis: {
              scale: true,
              scaleSize: 6,
              itemStyle: {
                shadowBlur: 12,
                shadowOffsetX: 0,
                shadowColor: 'rgba(15, 23, 42, 0.15)'
              }
            },
            data,
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: function () {
              return Math.random() * 200
            }
          }
        ]
      }
      this.chart.hideLoading()
      this.chart.setOption(option, true)
    }
  }
}
</script>

<style scoped>
.data-statistics-page {
  max-width: 1200px;
  margin: 0 auto;
}

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

/* ===== 顶部统计卡行 ===== */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: var(--oc-radius-md);
  box-shadow: var(--oc-shadow-sm);
  padding: 18px 20px;
}

.stat-card-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
  margin-bottom: 8px;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-blue { background: var(--oc-blue-600); }
.dot-cyan { background: var(--oc-cyan-500); }
.dot-amber { background: var(--oc-warning); }

.stat-card-num {
  font-size: 32px;
  font-weight: 700;
  color: var(--oc-gray-900);
  line-height: 1.2;
  font-feature-settings: "tnum";
}

/* ===== 图表卡 ===== */
.chart-card {
  position: relative;
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: var(--oc-radius-md);
  padding: 24px;
  box-shadow: var(--oc-shadow-sm);
  display: flex;
  align-items: center;
  gap: 24px;
}

.chart-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.chart-container {
  width: 100%;
  height: 420px;
}

/* 环形图中心文字 */
.donut-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.donut-total {
  font-size: 32px;
  font-weight: 700;
  color: var(--oc-gray-900);
  line-height: 1.2;
  font-feature-settings: "tnum";
}

.donut-label {
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-400);
  margin-top: 2px;
}

/* 右侧纵向图例 */
.legend-list {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 420px;
  overflow-y: auto;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--oc-radius);
  transition: background-color 0.2s ease;
}

.legend-item:hover {
  background: var(--oc-gray-50);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name {
  flex: 1;
  min-width: 0;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-700);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-value {
  font-size: var(--oc-text-sm);
  font-weight: 600;
  color: var(--oc-gray-900);
  font-feature-settings: "tnum";
}

.legend-percent {
  width: 48px;
  text-align: right;
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
  font-feature-settings: "tnum";
  flex-shrink: 0;
}

/* ===== 空状态覆盖层 ===== */
.empty-overlay {
  position: absolute;
  inset: 0;
  background: var(--oc-bg-white);
  border-radius: var(--oc-radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.empty-illustration {
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
}

.empty-illustration svg {
  width: 100%;
  height: 100%;
}

.empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--oc-gray-700);
}

.empty-sub {
  margin: 6px 0 0;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-400);
}
</style>
