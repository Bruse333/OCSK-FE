<template>
  <div class="h5-mine-page">
    <!-- 资料卡：深蓝渐变横幅 -->
    <div class="h5-profile-banner">
      <div class="h5-profile-info">
        <div class="h5-avatar">{{ username.charAt(0).toUpperCase() }}</div>
        <div class="h5-user-meta">
          <span class="h5-username">{{ username }}</span>
          <span class="h5-privilege-tag" :class="'tag-' + privilegeClass">{{ privilegeLabel }}</span>
        </div>
      </div>
    </div>

    <!-- 账号信息卡 -->
    <div class="h5-info-card">
      <div class="h5-card-title">账号信息</div>
      <div class="h5-info-row">
        <span class="h5-info-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </span>
        <span class="h5-info-label">用户名</span>
        <span class="h5-info-value">{{ username }}</span>
      </div>
      <div class="h5-info-row">
        <span class="h5-info-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </span>
        <span class="h5-info-label">权限等级</span>
        <span class="h5-info-value">
          <span class="h5-cell-tag" :class="'tag-' + privilegeClass">{{ privilegeLabel }}</span>
        </span>
      </div>
    </div>

    <!-- 权限说明卡 -->
    <div class="h5-info-card">
      <div class="h5-card-title">权限说明</div>
      <div class="h5-priv-list">
        <div class="h5-priv-card" v-for="item in privDefs" :key="item.level">
          <span class="h5-priv-icon" :class="item.iconClass" v-html="item.icon"></span>
          <div class="h5-priv-main">
            <div class="h5-priv-name">{{ item.name }}</div>
            <div class="h5-priv-desc">{{ item.desc }}</div>
          </div>
          <span class="h5-priv-status" :class="{ owned: hasPriv(item.level) }">
            <svg v-if="hasPriv(item.level)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span v-else class="h5-priv-status-dash"></span>
          </span>
        </div>
      </div>
    </div>

    <!-- 退出登录：危险次按钮 -->
    <div class="h5-logout-wrap">
      <button class="h5-logout-btn" @click="confirmLogout">退出登录</button>
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
      privilegeClass: '',
      // 权限说明卡片定义（纯展示数据）
      privDefs: [
        {
          level: 1, name: '信息检索', desc: '检索船型故障排查记录', iconClass: 'icon-blue',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
        },
        {
          level: 2, name: '数据上传', desc: '新增与编辑排查记录', iconClass: 'icon-cyan',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
        },
        {
          level: 3, name: '系统管理', desc: '批量上传、统计与用户管理', iconClass: 'icon-amber',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
        }
      ]
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
    hasPriv(level) {
      return this.privilege >= level
    },
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

/* ===== 资料卡：深蓝渐变横幅 ===== */
.h5-profile-banner {
  position: relative;
  height: 140px;
  border-radius: var(--oc-radius-lg);
  background: linear-gradient(135deg, var(--oc-navy-800), var(--oc-blue-700));
  overflow: hidden;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.h5-profile-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 82% 18%, rgba(6, 182, 212, 0.22), transparent 55%);
  pointer-events: none;
}

.h5-profile-info {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
}

.h5-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--oc-bg-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: var(--oc-blue-700);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  flex-shrink: 0;
}

.h5-user-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.h5-username {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

/* 横幅上的权限标签 */
.h5-privilege-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--oc-radius-sm);
  font-size: var(--oc-text-xs);
  font-weight: 500;
  width: fit-content;
}

.h5-privilege-tag.tag-admin {
  background: rgba(245, 158, 11, 0.2);
  color: #FBBF24;
}

.h5-privilege-tag.tag-advanced {
  background: rgba(59, 130, 246, 0.22);
  color: var(--oc-blue-300);
}

.h5-privilege-tag.tag-normal {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.72);
}

/* ===== 信息卡片 ===== */
.h5-info-card {
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: 14px;
  box-shadow: var(--oc-shadow-sm);
  margin-bottom: 12px;
  overflow: hidden;
}

.h5-card-title {
  padding: 13px 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--oc-gray-900);
  border-bottom: 1px solid var(--oc-border-light);
}

.h5-info-row {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  gap: 10px;
  border-bottom: 1px solid var(--oc-gray-100);
}

.h5-info-row:last-child {
  border-bottom: none;
}

.h5-info-icon {
  width: 16px;
  height: 16px;
  color: var(--oc-gray-400);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.h5-info-icon svg {
  width: 100%;
  height: 100%;
}

.h5-info-label {
  font-size: var(--oc-text-md);
  color: var(--oc-gray-500);
  flex: 1;
}

.h5-info-value {
  font-size: var(--oc-text-md);
  font-weight: 500;
  color: var(--oc-gray-900);
}

/* 白底上的权限标签 */
.h5-cell-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--oc-radius-sm);
  font-size: var(--oc-text-xs);
  font-weight: 500;
}

.h5-cell-tag.tag-admin {
  background: var(--oc-warning-bg);
  color: #B45309;
}

.h5-cell-tag.tag-advanced {
  background: var(--oc-blue-50);
  color: var(--oc-blue-700);
}

.h5-cell-tag.tag-normal {
  background: var(--oc-info-bg);
  color: var(--oc-gray-500);
}

/* ===== 权限说明：纵向小卡 ===== */
.h5-priv-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 16px;
}

.h5-priv-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--oc-gray-200);
  border-radius: var(--oc-radius-md);
  padding: 12px 14px;
}

.h5-priv-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.h5-priv-icon.icon-blue { color: var(--oc-blue-600); }
.h5-priv-icon.icon-cyan { color: var(--oc-cyan-500); }
.h5-priv-icon.icon-amber { color: var(--oc-warning); }

.h5-priv-main {
  flex: 1;
  min-width: 0;
}

.h5-priv-name {
  font-size: var(--oc-text-md);
  font-weight: 600;
  color: var(--oc-gray-900);
  margin-bottom: 2px;
}

.h5-priv-desc {
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
}

/* 有/无状态：绿色对勾圆点 / 灰色横线 */
.h5-priv-status {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.h5-priv-status.owned {
  background: var(--oc-success);
  color: #fff;
}

.h5-priv-status.owned svg {
  width: 10px;
  height: 10px;
}

.h5-priv-status-dash {
  width: 12px;
  height: 2px;
  border-radius: 1px;
  background: var(--oc-gray-300);
}

/* ===== 退出登录：危险次按钮 ===== */
.h5-logout-wrap {
  display: flex;
  margin-top: 4px;
}

.h5-logout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 24px;
  font-size: var(--oc-text-md);
  font-weight: 500;
  color: var(--oc-danger);
  background: var(--oc-bg-white);
  border: 1px solid var(--oc-danger);
  border-radius: var(--oc-radius);
  cursor: pointer;
}

.h5-logout-btn:active {
  background: var(--oc-danger-bg);
}
</style>
