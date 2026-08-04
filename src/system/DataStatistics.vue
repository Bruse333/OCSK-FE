<template>
  <div class="data-statistics-page">
    <div class="page-header">
      <h2 class="page-title">故障记录统计</h2>
      <p class="page-subtitle">按船型统计故障记录分布情况</p>
    </div>
    <div class="chart-card">
      <div ref="chartRef" class="chart-container"></div>
      <div v-if="isEmpty" class="empty-state">
        <p>暂无统计数据</p>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

export default {
  name: 'DataStatisticsPage',
  data() {
    return {
      chart: null,
      isEmpty: false
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
          color: '#3584e4',
          textColor: '#1a3a6e',
          maskColor: 'rgba(255, 255, 255, 0.8)'
        })
        const res = await request.get('/reports/trbstCount')
        if (res.data.code === 1) {
          const data = res.data.data || []
          if (data.length === 0) {
            this.isEmpty = true
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
      const option = {
        title: {
          text: `故障记录总数：${total}`,
          left: '2%',
          top: '2%',
          textStyle: {
            color: '#1a3a6e',
            fontSize: 16,
            fontWeight: 600
          },
          subtext: '按船型分布',
          subtextStyle: {
            color: '#666',
            fontSize: 12
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          bottom: '5%',
          left: 'center',
          textStyle: {
            color: '#666'
          }
        },
        color: ['#3584e4', '#1a5fb4', '#5FB0E6', '#87CEEB', '#19be6b', '#ff9900', '#ed4014'],
        series: [
          {
            name: '故障记录',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{c} ({d}%)',
              color: '#333'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
              }
            },
            labelLine: {
              show: true,
              lineStyle: {
                color: '#999'
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
      this.chart.setOption(option)
    }
  }
}
</script>

<style scoped>
.data-statistics-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--oc-title, #1a3a6e);
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--oc-text-light, #999);
}

.chart-card {
  background: var(--oc-bg-white, #fff);
  border-radius: var(--oc-radius, 10px);
  padding: 24px;
  box-shadow: var(--oc-shadow, 0 2px 12px rgba(0, 0, 0, 0.06));
  position: relative;
}

.chart-container {
  width: 100%;
  height: 500px;
}

.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--oc-text-light, #999);
  font-size: 14px;
}
</style>
