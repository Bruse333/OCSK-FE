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
          <span class="info-icon">👤</span>
          <span class="info-label">用户名</span>
          <span class="info-value">{{ username }}</span>
        </div>
        <div class="info-row">
          <span class="info-icon">🔒</span>
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
        <div class="info-row logout-row" @click="showLogoutModal = true">
          <span class="info-icon">🚪</span>
          <span class="info-label logout-label">退出登录</span>
          <span class="info-arrow">→</span>
        </div>
      </div>
    </div>

    <!-- 退出确认弹窗 -->
    <div class="modal-overlay" v-if="showLogoutModal" @click.self="showLogoutModal = false">
      <div class="modal-dialog confirm-modal">
        <div class="modal-header">
          <h2>退出登录</h2>
          <button class="modal-close" @click="showLogoutModal = false">×</button>
        </div>
        <div class="modal-body">
          <p class="confirm-msg">确定要退出登录吗？</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showLogoutModal = false">取消</button>
          <button class="btn-delete" @click="handleLogout">确认</button>
        </div>
      </div>
    </div>

    <!-- 提示弹框 -->
    <transition name="fade">
      <div v-if="alertBox.show" class="alert-overlay" @click.self="closeAlert">
        <div class="alert-dialog">
          <p class="alert-msg">{{ alertBox.msg }}</p>
          <button class="alert-btn" @click="closeAlert">确定</button>
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
  name: 'MinePage',
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
.mine-page {
  max-width: 600px;
  margin: 0 auto;
}

/* 用户卡片 */
.user-card-section {
  position: relative;
  margin-bottom: 20px;
  border-radius: 10px;
  overflow: hidden;
}

.user-card-bg {
  height: 150px;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border-radius: 10px;
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
  color: #1a5fb4;
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

/* 信息区块 */
.info-section {
  background: #fff;
  border-radius: 10px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-title {
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #999;
  border-bottom: 1px solid #f0f0f0;
}

.info-list {
  padding: 0;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-icon {
  font-size: 18px;
  flex-shrink: 0;
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
  color: #ed4014;
}

.info-arrow {
  font-size: 14px;
  color: #ccc;
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
  background: #19be6b;
}

.dot-blue {
  background: #1E90FF;
}

.dot-orange {
  background: #ff9900;
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
  color: #19be6b;
}

.priv-row.disabled .priv-status {
  color: #c0c4cc;
}

.priv-row.disabled .priv-name {
  color: #999;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 30, 60, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-dialog {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.confirm-modal {
  width: 400px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  color: #fff;
}

.modal-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 20px 24px;
}

.confirm-msg {
  margin: 0;
  font-size: 15px;
  color: #333;
  text-align: center;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

.btn-cancel {
  padding: 8px 20px;
  font-size: 14px;
  color: #1a5fb4;
  background: #fff;
  border: 1px solid #3584e4;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f0f5ff;
}

.btn-delete {
  padding: 8px 20px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, #ed4014, #d03020);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-delete:hover {
  background: linear-gradient(135deg, #d03020, #b02818);
}

/* 提示弹框 */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 30, 60, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.alert-dialog {
  background: #fff;
  border-radius: 10px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.alert-msg {
  margin: 0;
  padding: 28px 24px;
  font-size: 15px;
  color: #1a3a6e;
  text-align: center;
  line-height: 1.6;
}

.alert-btn {
  display: block;
  width: 100%;
  padding: 12px 0;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  cursor: pointer;
}

.alert-btn:hover {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
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