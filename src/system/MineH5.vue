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
      <div class="h5-info-row h5-logout-row" @click="showLogoutModal = true">
        <span class="h5-info-icon">🚪</span>
        <span class="h5-info-label h5-logout-label">退出登录</span>
        <span class="h5-info-arrow">&#8250;</span>
      </div>
    </div>

    <!-- 退出确认弹窗 -->
    <div class="h5-modal-overlay" v-if="showLogoutModal" @click.self="showLogoutModal = false">
      <div class="h5-confirm-dialog">
        <p class="h5-confirm-msg">确定要退出登录吗？</p>
        <div class="h5-confirm-btns">
          <button class="h5-btn-cancel" @click="showLogoutModal = false">取消</button>
          <button class="h5-btn-logout" @click="handleLogout">确认</button>
        </div>
      </div>
    </div>

    <!-- 提示弹框 -->
    <transition name="fade">
      <div v-if="alertBox.show" class="h5-alert-overlay" @click.self="closeAlert">
        <div class="h5-alert-dialog">
          <p class="h5-alert-msg">{{ alertBox.msg }}</p>
          <button class="h5-alert-btn" @click="closeAlert">确定</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
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
      privilegeClass: '',
      showLogoutModal: false,
      alertBox: { show: false, msg: '' }
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
    showAlert(msg) {
      this.alertBox.msg = msg
      this.alertBox.show = true
    },
    closeAlert() {
      this.alertBox.show = false
    },
    handleLogout() {
      this.showLogoutModal = false
      removeToken()
      removeUsername()
      removePrivilege()
      this.showAlert('已退出登录！')
      setTimeout(() => {
        this.$router.push('/login')
      }, 1000)
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
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border-radius: 10px;
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
  color: #1a5fb4;
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
  color: #1E90FF;
}

.tag-advanced {
  background: #e8f7ff;
  color: #19be6b;
}

.tag-admin {
  background: #fff7e6;
  color: #ff9900;
}

/* 信息卡片 */
.h5-info-card {
  background: #fff;
  border-radius: 10px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.h5-info-title {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #999;
  border-bottom: 1px solid #f0f0f0;
}

.h5-info-row {
  display: flex;
  align-items: center;
  padding: 13px 16px;
  gap: 10px;
  border-bottom: 1px solid #f0f0f0;
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
  color: #666;
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
  color: #ed4014;
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
  border-bottom: 1px solid #f0f0f0;
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
  background: #19be6b;
}

.dot-blue {
  background: #1E90FF;
}

.dot-orange {
  background: #ff9900;
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
  color: #19be6b;
}

.h5-priv-row.disabled .h5-priv-status {
  color: #c0c4cc;
}

.h5-priv-row.disabled .h5-priv-name {
  color: #999;
}

/* 弹窗 */
.h5-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
  box-sizing: border-box;
}

.h5-confirm-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 300px;
}

.h5-confirm-msg {
  font-size: 15px;
  color: #333;
  text-align: center;
  margin: 0 0 20px;
}

.h5-confirm-btns {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.h5-btn-cancel,
.h5-btn-logout {
  padding: 8px 20px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
}

.h5-btn-cancel {
  color: #1a5fb4;
  background: #fff;
  border: 1px solid #3584e4;
}

.h5-btn-logout {
  color: #fff;
  background: #ed4014;
  border: none;
}

/* 提示弹框 */
.h5-alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.h5-alert-dialog {
  background: #fff;
  border-radius: 10px;
  width: 80vw;
  max-width: 300px;
  overflow: hidden;
}

.h5-alert-msg {
  margin: 0;
  padding: 24px 20px;
  font-size: 15px;
  color: #333;
  text-align: center;
  line-height: 1.5;
}

.h5-alert-btn {
  display: block;
  width: 100%;
  padding: 12px 0;
  font-size: 15px;
  color: #fff;
  background: #1a5fb4;
  border: none;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
