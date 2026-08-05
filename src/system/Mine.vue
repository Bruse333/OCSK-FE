<template>
  <div class="mine-page" :class="'theme-' + theme">
    <!-- 资料卡：深蓝渐变横幅 -->
    <div class="profile-banner">
      <!-- 横幅装饰：右侧闪烁星星 -->
      <div class="banner-decor" aria-hidden="true">
        <span class="b-star s1"></span>
        <span class="b-star s2"></span>
        <span class="b-star s3"></span>
        <span class="b-star s4"></span>
        <span class="b-star s5"></span>
        <span class="b-star s6"></span>
        <span class="b-star s7"></span>
      </div>
      <!-- 白云（清晨/白日） -->
      <svg class="b-cloud c1" viewBox="0 0 80 36" fill="#fff" aria-hidden="true">
        <ellipse cx="22" cy="25" rx="16" ry="9"/><ellipse cx="42" cy="17" rx="18" ry="12"/><ellipse cx="62" cy="25" rx="14" ry="8"/>
      </svg>
      <svg class="b-cloud c2" viewBox="0 0 80 36" fill="#fff" aria-hidden="true">
        <ellipse cx="22" cy="25" rx="16" ry="9"/><ellipse cx="42" cy="17" rx="18" ry="12"/><ellipse cx="62" cy="25" rx="14" ry="8"/>
      </svg>
      <!-- 小落日 + 剪影飞鸟（傍晚） -->
      <div class="b-dusk-sun" aria-hidden="true"></div>
      <svg class="b-bird" viewBox="0 0 32 12" fill="none" stroke-linecap="round" aria-hidden="true">
        <path d="M2 10 Q9 2 16 10 Q23 2 30 10"/>
      </svg>
      <div class="profile-info">
        <div class="avatar">{{ username.charAt(0).toUpperCase() }}</div>
        <div class="user-meta">
          <span class="username">{{ username }}</span>
          <span class="privilege-tag" :class="'tag-' + privilegeClass">{{ privilegeLabel }}</span>
        </div>
      </div>
    </div>

    <!-- 账号信息卡 -->
    <div class="info-card">
      <div class="card-title">账号信息</div>
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

    <!-- 权限说明卡 -->
    <div class="info-card">
      <div class="card-title">权限说明</div>
      <div class="priv-grid">
        <div class="priv-card" v-for="item in privDefs" :key="item.level">
          <div class="priv-card-head">
            <span class="priv-icon" :class="item.iconClass"><el-icon><component :is="item.icon" /></el-icon></span>
            <span class="priv-status" :class="{ owned: hasPriv(item.level) }">
              <svg v-if="hasPriv(item.level)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span v-else class="priv-status-dash"></span>
            </span>
          </div>
          <div class="priv-name">{{ item.name }}</div>
          <div class="priv-desc">{{ item.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 退出登录：危险次按钮 -->
    <div class="logout-wrap">
      <button class="logout-btn" @click="confirmLogout">
        <el-icon><SwitchButton /></el-icon>
        退出登录
      </button>
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
  name: 'MinePage',
  data() {
    return {
      username: '',
      privilege: 1,
      privilegeLabel: '',
      privilegeClass: '',
      theme: 'night',
      // 权限说明卡片定义（纯展示数据）
      privDefs: [
        { level: 1, name: '信息检索', desc: '检索船型故障排查记录', icon: 'Search', iconClass: 'icon-blue' },
        { level: 2, name: '数据上传', desc: '新增与编辑排查记录', icon: 'Upload', iconClass: 'icon-cyan' },
        { level: 3, name: '系统管理', desc: '批量上传、统计与用户管理', icon: 'Setting', iconClass: 'icon-amber' }
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
        // 用户取消，不做处理
      })
    }
  }
}
</script>

<style scoped>
.mine-page {
  max-width: 880px;
  margin: 0 auto;
}

/* ===== 资料卡：深蓝渐变横幅 ===== */
.profile-banner {
  position: relative;
  height: 140px;
  border-radius: var(--oc-radius-lg);
  background: var(--oc-banner-bg);
  overflow: hidden;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  padding: 0 28px;
}

/* 光斑装饰（克制，同登录页手法） */
.profile-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--oc-banner-glow);
  pointer-events: none;
}

/* --- 横幅装饰：星星（右半部，避开左侧头像/用户名；仅夜晚/傍晚显示） --- */
.banner-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: none;
}

.theme-night .banner-decor {
  display: block;
}

.theme-dusk .banner-decor {
  display: block;
  opacity: 0.6;
}

.b-star {
  position: absolute;
  background: #fff;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  opacity: 0.55;
  animation: star-twinkle ease-in-out infinite;
}

.b-star.s1 { top: 20%; left: 58%; width: 6px; height: 6px; animation-duration: 2.8s; }
.b-star.s2 { top: 12%; left: 70%; width: 9px; height: 9px; box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.4); animation-duration: 3.6s; animation-delay: 0.8s; }
.b-star.s3 { top: 30%; left: 82%; width: 5px; height: 5px; animation-duration: 2.4s; animation-delay: 1.6s; }
.b-star.s4 { top: 60%; left: 66%; width: 5px; height: 5px; animation-duration: 3.2s; animation-delay: 0.4s; }
.b-star.s5 { top: 70%; left: 78%; width: 8px; height: 8px; box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.4); animation-duration: 2.6s; animation-delay: 2s; }
.b-star.s6 { top: 55%; left: 90%; width: 6px; height: 6px; animation-duration: 3.8s; animation-delay: 1.2s; }
.b-star.s7 { top: 26%; left: 94%; width: 10px; height: 10px; background: var(--oc-cyan-300); box-shadow: 0 0 12px 2px rgba(6, 182, 212, 0.45); animation-duration: 3s; animation-delay: 0.6s; }

@keyframes star-twinkle {
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
.b-cloud {
  position: absolute;
  display: none;
  left: -12%;
  opacity: 0.85;
  pointer-events: none;
  animation: b-cloud-drift linear infinite;
}

.b-cloud.c1 { top: 18%; width: 58px; animation-duration: 30s; }
.b-cloud.c2 { top: 52%; width: 40px; opacity: 0.6; animation-duration: 40s; animation-delay: -16s; }

@keyframes b-cloud-drift {
  from { left: -12%; }
  to { left: 104%; }
}

/* --- 横幅小落日 + 剪影飞鸟（傍晚） --- */
.b-dusk-sun {
  position: absolute;
  display: none;
  right: 9%;
  top: 50%;
  width: 46px;
  height: 46px;
  margin-top: -23px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, #FDBA74, #F97316 72%);
  box-shadow: 0 0 24px 10px rgba(249, 115, 22, 0.45);
  pointer-events: none;
  animation: b-sun-breathe 4.5s ease-in-out infinite;
}

@keyframes b-sun-breathe {
  0%, 100% { box-shadow: 0 0 24px 10px rgba(249, 115, 22, 0.45); }
  50% { box-shadow: 0 0 32px 16px rgba(249, 115, 22, 0.6); }
}

.b-bird {
  position: absolute;
  display: none;
  top: 24%;
  left: -6%;
  width: 20px;
  stroke: rgba(30, 27, 75, 0.8);
  stroke-width: 2.2;
  opacity: 0;
  pointer-events: none;
  animation: b-bird-fly 22s linear infinite;
  animation-delay: 4s;
}

@keyframes b-bird-fly {
  0% { left: -6%; opacity: 0; }
  3% { opacity: 0.85; }
  42% { opacity: 0.85; }
  46% { left: 103%; opacity: 0; }
  100% { left: 103%; opacity: 0; }
}

/* 主题显隐规则 */
.theme-morning .b-cloud,
.theme-day .b-cloud {
  display: block;
}

.theme-dusk .b-dusk-sun,
.theme-dusk .b-bird {
  display: block;
}

.profile-info {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--oc-bg-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  color: var(--oc-blue-700);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  flex-shrink: 0;
}

/* 头像声呐脉冲环 */
.avatar::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.55);
  animation: avatar-pulse 3.2s ease-out infinite;
  pointer-events: none;
}

@keyframes avatar-pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.username {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

/* 横幅上的权限标签：琥珀金（管理员）/ 蓝 / 灰 */
.privilege-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--oc-radius-sm);
  font-size: var(--oc-text-xs);
  font-weight: 500;
  width: fit-content;
}

.privilege-tag.tag-admin {
  background: rgba(245, 158, 11, 0.2);
  color: #FBBF24;
}

.privilege-tag.tag-advanced {
  background: rgba(59, 130, 246, 0.22);
  color: var(--oc-blue-300);
}

.privilege-tag.tag-normal {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.72);
}

/* ===== 信息卡片 ===== */
.info-card {
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: var(--oc-radius-md);
  box-shadow: var(--oc-shadow-sm);
  margin-bottom: 16px;
  overflow: hidden;
}

.card-title {
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--oc-gray-900);
  border-bottom: 1px solid var(--oc-border-light);
}

.info-row {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 20px;
  gap: 12px;
  border-bottom: 1px solid var(--oc-gray-100);
}

.info-row:last-child {
  border-bottom: none;
}

.info-icon {
  font-size: 16px;
  color: var(--oc-gray-400);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.info-label {
  font-size: var(--oc-text-md);
  color: var(--oc-gray-500);
  flex: 1;
}

.info-value {
  font-size: var(--oc-text-md);
  font-weight: 500;
  color: var(--oc-gray-900);
}

/* 白底上的权限标签 */
.cell-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--oc-radius-sm);
  font-size: var(--oc-text-xs);
  font-weight: 500;
}

.cell-tag.tag-admin {
  background: var(--oc-warning-bg);
  color: #B45309;
}

.cell-tag.tag-advanced {
  background: var(--oc-blue-50);
  color: var(--oc-blue-700);
}

.cell-tag.tag-normal {
  background: var(--oc-info-bg);
  color: var(--oc-gray-500);
}

/* ===== 权限说明：三小卡 ===== */
.priv-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px 20px 20px;
}

.priv-card {
  border: 1px solid var(--oc-gray-200);
  border-radius: var(--oc-radius-md);
  padding: 16px;
}

.priv-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.priv-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
}

.priv-icon.icon-blue { color: var(--oc-blue-600); }
.priv-icon.icon-cyan { color: var(--oc-cyan-500); }
.priv-icon.icon-amber { color: var(--oc-warning); }

/* 有/无状态：绿色对勾圆点 / 灰色横线 */
.priv-status {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.priv-status.owned {
  background: var(--oc-success);
  color: #fff;
}

.priv-status.owned svg {
  width: 10px;
  height: 10px;
}

.priv-status-dash {
  width: 12px;
  height: 2px;
  border-radius: 1px;
  background: var(--oc-gray-300);
}

.priv-name {
  font-size: var(--oc-text-md);
  font-weight: 600;
  color: var(--oc-gray-900);
  margin-bottom: 4px;
}

.priv-desc {
  font-size: var(--oc-text-xs);
  color: var(--oc-gray-400);
  line-height: 1.5;
}

/* ===== 退出登录：危险次按钮 ===== */
.logout-wrap {
  display: flex;
  margin-bottom: 24px;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 24px;
  font-size: var(--oc-text-md);
  font-weight: 500;
  color: var(--oc-danger);
  background: var(--oc-bg-white);
  border: 1px solid var(--oc-danger);
  border-radius: var(--oc-radius);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background: var(--oc-danger-bg);
}

/* 尊重系统减弱动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .b-star,
  .avatar::after,
  .b-cloud,
  .b-dusk-sun,
  .b-bird {
    animation: none;
  }
}
</style>
