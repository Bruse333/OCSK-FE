<template>
  <div class="mine-page">
    <!-- 用户卡片 -->
    <div class="user-card-section">
      <div class="user-card-bg"></div>
      <div class="user-card">
        <div class="avatar">{{ username.charAt(0).toUpperCase() }}</div>
        <div class="user-meta">
          <span class="username">{{ username }}</span>
          <span class="privilege-tag" :class="'tag-' + privilegeClass">{{ privilegeLabel }}</span>
        </div>
      </div>
    </div>

    <!-- 账号信息 -->
    <div class="info-section">
      <div class="section-title">账号信息</div>
      <div class="info-list">
        <div class="info-row">
          <span class="info-icon"><el-icon><User /></el-icon></span>
          <span class="info-label">用户名</span>
          <span class="info-value">{{ username }}</span>
        </div>
        <div class="info-row">
          <span class="info-icon"><el-icon><Lock /></el-icon></span>
          <span class="info-label">权限等级</span>
          <span class="info-value">
            <span class="cell-tag" :class="'tag-' + privilegeClass">{{ privilegeLabel }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 权限说明 -->
    <div class="info-section">
      <div class="section-title">权限说明</div>
      <div class="privilege-desc">
        <div class="priv-row" :class="privilege >= 1 ? 'active' : 'disabled'">
          <span class="priv-dot dot-green"></span>
          <span class="priv-name">信息检索</span>
          <span class="priv-status">{{ privilege >= 1 ? '✓' : '×' }}</span>
        </div>
        <div class="priv-row" :class="privilege >= 2 ? 'active' : 'disabled'">
          <span class="priv-dot dot-blue"></span>
          <span class="priv-name">数据上传</span>
          <span class="priv-status">{{ privilege >= 2 ? '✓' : '×' }}</span>
        </div>
        <div class="priv-row" :class="privilege >= 3 ? 'active' : 'disabled'">
          <span class="priv-dot dot-orange"></span>
          <span class="priv-name">系统管理</span>
          <span class="priv-status">{{ privilege >= 3 ? '✓' : '×' }}</span>
        </div>
      </div>
    </div>

    <!-- 操作 -->
    <div class="info-section">
      <div class="info-list">
        <div class="info-row logout-row" @click="confirmLogout">
          <span class="info-icon"><el-icon><SwitchButton /></el-icon></span>
          <span class="info-label logout-label">退出登录</span>
          <span class="info-arrow"><el-icon><ArrowRight /></el-icon></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsername, removeToken, removeUsername, removePrivilege, getPrivilege } from '@/utils/token'

const PRIVILEGE_MAP = {
  1: { label: '仅检索', cls: 'normal' },
  2: { label: '检索 + 上传', cls: 'advanced' },
  3: { label: '全部权限', cls: 'admin' }
}

export default {
  name: 'MinePage',
  data() {
    return {
      username: '',
      privilege: 1,
      privilegeLabel: '',
      privilegeClass: ''
    }
  },
  created() {
    this.username = getUsername() || ''
    this.privilege = getPrivilege()
    const p = PRIVILEGE_MAP[this.privilege] || { label: '未知', cls: 'normal' }
    this.privilegeLabel = p.label
    this.privilegeClass = p.cls
  },
  methods: {
    confirmLogout() {
      ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        removeToken()
        removeUsername()
        removePrivilege()
        ElMessage({ message: '已退出登录！', type: 'success' })
        setTimeout(() => {
          this.$router.push('/login')
        }, 800)
      }).catch(() => {
        // 用户取消，不做处理
      })
    }
  }
}
</script>

<style scoped>
.mine-page {
  max-width: 600px;
  margin: 0 auto;
}

/* 用户卡片 */
.user-card-section {
  position: relative;
  margin-bottom: 20px;
  border-radius: var(--oc-radius, 10px);
  overflow: hidden;
}

.user-card-bg {
  height: 150px;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  border-radius: var(--oc-radius, 10px);
}

.user-card {
  position: absolute;
  bottom: 20px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: var(--oc-primary-dark, #1a5fb4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.username {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.privilege-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  width: fit-content;
}

.tag-normal {
  background: #e8f4ff;
  color: var(--oc-primary, #3584e4);
}

.tag-advanced {
  background: #e8f7ff;
  color: var(--oc-success, #19be6b);
}

.tag-admin {
  background: #fff7e6;
  color: var(--oc-warning, #ff9900);
}

/* 信息区块 */
.info-section {
  background: #fff;
  border-radius: var(--oc-radius, 10px);
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-title {
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--oc-text-light, #8a94a6);
  border-bottom: 1px solid var(--oc-border, #eef1f6);
}

.info-list {
  padding: 0;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  gap: 12px;
  border-bottom: 1px solid var(--oc-border, #eef1f6);
}

.info-row:last-child {
  border-bottom: none;
}

.info-icon {
  font-size: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--oc-text, #46587a);
}

.info-label {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.info-value {
  font-size: 14px;
  color: #666;
}

.cell-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* 退出登录行 */
.logout-row {
  cursor: pointer;
  transition: background 0.2s;
}

.logout-row:hover {
  background: #fef0f0;
}

.logout-label {
  color: var(--oc-danger, #ed4014);
}

.info-arrow {
  font-size: 14px;
  color: #ccc;
  display: flex;
  align-items: center;
}

/* 权限说明 */
.privilege-desc {
  padding: 8px 20px;
}

.priv-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  gap: 10px;
}

.priv-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green {
  background: var(--oc-success, #19be6b);
}

.dot-blue {
  background: var(--oc-primary, #3584e4);
}

.dot-orange {
  background: var(--oc-warning, #ff9900);
}

.priv-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.priv-status {
  font-size: 16px;
  font-weight: 600;
}

.priv-row.active .priv-status {
  color: var(--oc-success, #19be6b);
}

.priv-row.disabled .priv-status {
  color: #c0c4cc;
}

.priv-row.disabled .priv-name {
  color: var(--oc-text-light, #8a94a6);
}
</style>
