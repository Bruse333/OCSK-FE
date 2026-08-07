<template>
  <div class="h5-mine-page" :class="'theme-' + theme">
    <!-- 资料卡：深蓝渐变横幅（跟随主题） -->
    <div class="h5-profile-banner">
      <!-- 横幅装饰：星星（夜晚/傍晚） -->
      <div class="h5-banner-decor" aria-hidden="true">
        <span class="h5-b-star s1"></span>
        <span class="h5-b-star s2"></span>
        <span class="h5-b-star s3"></span>
        <span class="h5-b-star s4"></span>
        <span class="h5-b-star s5"></span>
        <span class="h5-b-star s6"></span>
      </div>
      <!-- 白云（清晨/白日） -->
      <svg class="h5-b-cloud c1" viewBox="0 0 80 36" fill="#fff" aria-hidden="true">
        <ellipse cx="22" cy="25" rx="16" ry="9"/><ellipse cx="42" cy="17" rx="18" ry="12"/><ellipse cx="62" cy="25" rx="14" ry="8"/>
      </svg>
      <svg class="h5-b-cloud c2" viewBox="0 0 80 36" fill="#fff" aria-hidden="true">
        <ellipse cx="22" cy="25" rx="16" ry="9"/><ellipse cx="42" cy="17" rx="18" ry="12"/><ellipse cx="62" cy="25" rx="14" ry="8"/>
      </svg>
      <!-- 小落日 + 剪影飞鸟（傍晚） -->
      <div class="h5-b-dusk-sun" aria-hidden="true"></div>
      <svg class="h5-b-bird" viewBox="0 0 32 12" fill="none" stroke-linecap="round" aria-hidden="true">
        <path d="M2 10 Q9 2 16 10 Q23 2 30 10"/>
      </svg>
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
import { getTimeTheme } from '@/utils/theme'

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
      theme: 'night',
      // 权限说明卡片定义（纯展示数据）
      privDefs: [
        {
          level: 1, name: '信息检索', desc: '检索船型故障排查记录', iconClass: 'icon-blue',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
        },
        {
          level: 2, name: '数据上传', desc: '新增与上传排查记录、构建流程文件', iconClass: 'icon-cyan',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
        },
        {
          level: 3, name: '系统管理', desc: '批量上传与流程管理、统计与用户管理', iconClass: 'icon-amber',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
        }
      ]
    }
  },
  created() {
    this.username = getUsername() || ''
    this.privilege = getPrivilege()
    this.theme = getTimeTheme()
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

/* ===== 资料卡：渐变横幅（跟随主题：清晨亮蓝/白日深蓝/傍晚紫橙/夜晚海军蓝） ===== */
.h5-profile-banner {
  position: relative;
  height: 140px;
  border-radius: var(--oc-radius-lg);
  background: var(--oc-banner-bg);
  overflow: hidden;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  transition: background 0.2s ease;
}

.h5-profile-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--oc-banner-glow);
  pointer-events: none;
}

/* --- 横幅星星装饰（仅夜晚/傍晚显示） --- */
.h5-banner-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: none;
}

.theme-night .h5-banner-decor {
  display: block;
}

.theme-dusk .h5-banner-decor {
  display: block;
  opacity: 0.6;
}

.h5-b-star {
  position: absolute;
  background: #fff;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  opacity: 0.55;
  animation: h5-star-twinkle ease-in-out infinite;
}

.h5-b-star.s1 { top: 18%; left: 60%; width: 5px; height: 5px; animation-duration: 2.8s; }
.h5-b-star.s2 { top: 10%; left: 72%; width: 8px; height: 8px; box-shadow: 0 0 9px 2px rgba(255, 255, 255, 0.4); animation-duration: 3.6s; animation-delay: 0.8s; }
.h5-b-star.s3 { top: 30%; left: 84%; width: 5px; height: 5px; animation-duration: 2.4s; animation-delay: 1.6s; }
.h5-b-star.s4 { top: 62%; left: 66%; width: 5px; height: 5px; animation-duration: 3.2s; animation-delay: 0.4s; }
.h5-b-star.s5 { top: 72%; left: 80%; width: 7px; height: 7px; box-shadow: 0 0 9px 2px rgba(255, 255, 255, 0.4); animation-duration: 2.6s; animation-delay: 2s; }
.h5-b-star.s6 { top: 50%; left: 92%; width: 5px; height: 5px; animation-duration: 3.8s; animation-delay: 1.2s; }

@keyframes h5-star-twinkle {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.85);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.1);
  }
}

/* --- 横幅白云（清晨/白日） --- */
.h5-b-cloud {
  position: absolute;
  display: none;
  left: -16%;
  opacity: 0.85;
  pointer-events: none;
  animation: h5-b-cloud-drift linear infinite;
}

.h5-b-cloud.c1 { top: 16%; width: 52px; animation-duration: 30s; }
.h5-b-cloud.c2 { top: 56%; width: 36px; opacity: 0.6; animation-duration: 40s; animation-delay: -16s; }

@keyframes h5-b-cloud-drift {
  from { left: -16%; }
  to { left: 104%; }
}

/* --- 横幅小落日 + 剪影飞鸟（傍晚） --- */
.h5-b-dusk-sun {
  position: absolute;
  display: none;
  right: 8%;
  top: 50%;
  width: 38px;
  height: 38px;
  margin-top: -19px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, #FDBA74, #F97316 72%);
  box-shadow: 0 0 20px 8px rgba(249, 115, 22, 0.45);
  pointer-events: none;
  animation: h5-b-sun-breathe 4.5s ease-in-out infinite;
}

@keyframes h5-b-sun-breathe {
  0%, 100% { box-shadow: 0 0 20px 8px rgba(249, 115, 22, 0.45); }
  50% { box-shadow: 0 0 28px 14px rgba(249, 115, 22, 0.6); }
}

.h5-b-bird {
  position: absolute;
  display: none;
  top: 22%;
  left: -8%;
  width: 18px;
  stroke: rgba(30, 27, 75, 0.8);
  stroke-width: 2.2;
  opacity: 0;
  pointer-events: none;
  animation: h5-b-bird-fly 22s linear infinite;
  animation-delay: 4s;
}

@keyframes h5-b-bird-fly {
  0% { left: -8%; opacity: 0; }
  3% { opacity: 0.85; }
  42% { opacity: 0.85; }
  46% { left: 103%; opacity: 0; }
  100% { left: 103%; opacity: 0; }
}

/* 主题显隐规则 */
.theme-morning .h5-b-cloud,
.theme-day .h5-b-cloud {
  display: block;
}

.theme-dusk .h5-b-dusk-sun,
.theme-dusk .h5-b-bird {
  display: block;
}

.h5-profile-info {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
}

.h5-avatar {
  position: relative;
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

/* 头像声呐脉冲环（全主题保留） */
.h5-avatar::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.55);
  animation: h5-avatar-pulse 3.2s ease-out infinite;
  pointer-events: none;
}

@keyframes h5-avatar-pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
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

/* 尊重系统减弱动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .h5-b-star,
  .h5-avatar::after,
  .h5-b-cloud,
  .h5-b-dusk-sun,
  .h5-b-bird {
    animation: none;
  }
}
</style>
