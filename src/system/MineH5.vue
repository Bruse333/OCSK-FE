<template>
  <div class="h5-mine-page">
    <!-- 用户卡片 -->
    <div class="h5-user-card-section">
      <div class="h5-user-card-bg">
        <div class="h5-user-card">
          <div class="h5-avatar">{{ username.charAt(0).toUpperCase() }}</div>
          <div class="h5-user-meta">
            <span class="h5-username">{{ username }}</span>
            <span class="h5-privilege-tag" :class="'tag-' + privilegeClass">{{ privilegeLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 账号信息 -->
    <div class="h5-info-card">
      <div class="h5-info-title">账号信息</div>
      <div class="h5-info-row">
        <span class="h5-info-icon">👤</span>
        <span class="h5-info-label">用户名</span>
        <span class="h5-info-value">{{ username }}</span>
      </div>
      <div class="h5-info-row">
        <span class="h5-info-icon">🔒</span>
        <span class="h5-info-label">权限等级</span>
        <span class="h5-info-value">
          <span class="h5-cell-tag" :class="'tag-' + privilegeClass">{{ privilegeLabel }}</span>
        </span>
      </div>
    </div>

    <!-- 权限说明 -->
    <div class="h5-info-card">
      <div class="h5-info-title">权限说明</div>
      <div class="h5-priv-row" :class="privilege >= 1 ? 'active' : 'disabled'">
        <span class="h5-priv-dot dot-green"></span>
        <span class="h5-priv-name">信息检索</span>
        <span class="h5-priv-status">{{ privilege >= 1 ? '✓' : '×' }}</span>
      </div>
      <div class="h5-priv-row" :class="privilege >= 2 ? 'active' : 'disabled'">
        <span class="h5-priv-dot dot-blue"></span>
        <span class="h5-priv-name">数据上传</span>
        <span class="h5-priv-status">{{ privilege >= 2 ? '✓' : '×' }}</span>
      </div>
      <div class="h5-priv-row" :class="privilege >= 3 ? 'active' : 'disabled'">
        <span class="h5-priv-dot dot-orange"></span>
        <span class="h5-priv-name">系统管理</span>
        <span class="h5-priv-status">{{ privilege >= 3 ? '✓' : '×' }}</span>
      </div>
    </div>

    <!-- 操作 -->
    <div class="h5-info-card">
      <div class="h5-info-row h5-logout-row" @click="confirmLogout">
        <span class="h5-info-icon">🚪</span>
        <span class="h5-info-label h5-logout-label">退出登录</span>
        <span class="h5-info-arrow">&#8250;</span>
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
  name: 'MinePageH5',
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
        // 用户取消
      })
    }
  }
}
</script>

<style scoped>
.h5-mine-page {
  padding-bottom: 12px;
}

/* 用户卡片 */
.h5-user-card-section {
  margin-bottom: 14px;
}

.h5-user-card-bg {
  position: relative;
  height: 150px;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  border-radius: var(--oc-radius, 10px);
}

.h5-user-card {
  position: absolute;
  bottom: 20px;
  left: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.h5-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: var(--oc-primary-dark, #1a5fb4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.h5-user-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.h5-username {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.h5-privilege-tag {
  display: inline-block;
  padding: 2px 8px;
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

/* 信息卡片 */
.h5-info-card {
  background: #fff;
  border-radius: var(--oc-radius, 10px);
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.h5-info-title {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--oc-text-light, #999);
  border-bottom: 1px solid var(--oc-border, #eef1f6);
}

.h5-info-row {
  display: flex;
  align-items: center;
  padding: 13px 16px;
  gap: 10px;
  border-bottom: 1px solid var(--oc-border, #eef1f6);
}

.h5-info-row:last-child {
  border-bottom: none;
}

.h5-info-icon {
  font-size: 17px;
  flex-shrink: 0;
}

.h5-info-label {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.h5-info-value {
  font-size: 14px;
  color: var(--oc-text, #46587a);
}

.h5-cell-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.h5-logout-row {
  cursor: pointer;
  transition: background 0.2s;
}

.h5-logout-row:active {
  background: #fef0f0;
}

.h5-logout-label {
  color: var(--oc-danger, #ed4014);
}

.h5-info-arrow {
  font-size: 18px;
  color: #ccc;
}

/* 权限说明 */
.h5-priv-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 10px;
  border-bottom: 1px solid var(--oc-border, #eef1f6);
}

.h5-priv-row:last-child {
  border-bottom: none;
}

.h5-priv-dot {
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

.h5-priv-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.h5-priv-status {
  font-size: 16px;
  font-weight: 600;
}

.h5-priv-row.active .h5-priv-status {
  color: var(--oc-success, #19be6b);
}

.h5-priv-row.disabled .h5-priv-status {
  color: #c0c4cc;
}

.h5-priv-row.disabled .h5-priv-name {
  color: var(--oc-text-light, #999);
}
</style>
