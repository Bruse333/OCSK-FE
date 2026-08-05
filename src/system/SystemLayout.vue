<template>
  <div class="system-wrapper" :class="'theme-' + theme">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <!-- 空白区星星点缀 -->
      <div class="sidebar-decor" aria-hidden="true">
        <span class="sb-star s1"></span>
        <span class="sb-star s2"></span>
        <span class="sb-star s3"></span>
        <span class="sb-star s4"></span>
        <span class="sb-star s5"></span>
        <span class="sb-star s6"></span>
        <span class="sb-star s7"></span>
        <span class="sb-star s8"></span>
      </div>
      <!-- Logo 区 -->
      <div class="sidebar-header">
        <span class="brand-mark">OC</span>
        <div class="brand-text" v-if="!isCollapsed">
          <span class="brand-name">OCSKILL</span>
          <span class="brand-sub">TECH KNOWLEDGE</span>
        </div>
        <!-- 时段图标：太阳（昼）/ 黄昏太阳（傍晚）/ 弯月（夜） -->
        <svg v-if="!isCollapsed && greetingIcon === 'sun'" class="sidebar-greet-icon icon-sun" viewBox="0 0 24 24" fill="none">
          <g class="rays" stroke="#F59E0B" stroke-width="2" stroke-linecap="round">
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>
          </g>
          <circle cx="12" cy="12" r="4.5" fill="#FBBF24"/>
        </svg>
        <svg v-else-if="!isCollapsed && greetingIcon === 'sunset'" class="sidebar-greet-icon icon-sunset" viewBox="0 0 24 24" fill="none">
          <g stroke="#FDBA74" stroke-width="2" stroke-linecap="round">
            <path d="M12 3.5v2M5.2 7.2l1.5 1.5M18.8 7.2l-1.5 1.5"/>
          </g>
          <path d="M7 16a5 5 0 0 1 10 0Z" fill="#FB923C"/>
          <path d="M3 16h18" stroke="#FDBA74" stroke-width="2" stroke-linecap="round"/>
          <path d="M7 20h10" stroke="#FDBA74" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        </svg>
        <svg v-else-if="!isCollapsed" class="sidebar-greet-icon icon-moon" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" fill="#FDE68A"/>
          <circle cx="17.5" cy="5" r="1" fill="#FDE68A" opacity=".85"/>
        </svg>
      </div>

      <!-- 菜单 -->
      <nav class="sidebar-menu">
        <template v-for="item in visibleMenuItems" :key="item.path || item.label">
          <!-- 无子菜单 -->
          <div
            v-if="!item.children"
            class="menu-item"
            :class="{ active: currentPath === item.path }"
            @click="navigateTo(item.path)"
          >
            <span class="menu-icon" v-html="item.icon"></span>
            <span class="menu-text" v-if="!isCollapsed">{{ item.label }}</span>
          </div>

          <!-- 分组（系统管理） -->
          <div v-else class="menu-group">
            <div class="menu-group-title" v-if="!isCollapsed">{{ item.label }}</div>
            <div
              v-for="child in item.children"
              :key="child.path"
              class="menu-item"
              :class="{ active: currentPath === child.path }"
              @click="navigateTo(child.path)"
            >
              <span class="menu-icon" v-html="child.icon"></span>
              <span class="menu-text" v-if="!isCollapsed">{{ child.label }}</span>
            </div>
          </div>
        </template>
      </nav>

      <!-- 底部区：返回首页 + 收起 -->
      <div class="sidebar-footer">
        <div class="menu-item footer-item" @click="backToHome">
          <span class="menu-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>
          </span>
          <span class="menu-text" v-if="!isCollapsed">返回首页</span>
        </div>
        <div class="menu-item footer-item" @click="toggleSidebar">
          <span class="menu-icon collapse-icon" :class="{ reversed: isCollapsed }">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 18-6-6 6-6"/></svg>
          </span>
          <span class="menu-text" v-if="!isCollapsed">收起</span>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <h1 class="top-title">{{ pageTitle }}</h1>
        <el-dropdown trigger="click" popper-class="oc-user-dropdown" @command="handleUserCommand">
          <div class="user-capsule">
            <span class="user-avatar">{{ avatarLetter }}</span>
            <span class="user-name">{{ username }}</span>
            <el-icon class="capsule-arrow"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="mine">
                <el-icon><User /></el-icon>个人中心
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided class="dropdown-item-danger">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </header>

      <!-- 内容区域 -->
      <main class="content-area">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsername, getPrivilege, removeToken, removeUsername, removePrivilege } from '@/utils/token'
import { getTimeTheme, getGreetingIcon } from '@/utils/theme'

export default {
  name: 'SystemLayout',
  data() {
    return {
      isCollapsed: false,
      username: '',
      privilege: 1,
      theme: 'night',
      menuItems: [
        {
          label: '信息检索',
          path: '/system/retrieval',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
        },
        {
          label: '添加记录',
          path: '/system/add',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>'
        },
        {
          label: '流程构建器',
          path: '/system/flow-builder',
          requiredPrivilege: 2,
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 6h9M6.2 8.2l4 7.3M17.8 8.2l-4 7.3"/></svg>'
        },
        {
          label: '个人中心',
          path: '/system/mine',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        },
        {
          label: '系统管理',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
          requiredPrivilege: 3,
          children: [
            {
              label: '批量上传',
              path: '/system/batch-upload',
              icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
            },
            {
              label: '数据统计',
              path: '/system/statistics',
              icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>'
            },
            {
              label: '用户管理',
              path: '/system/users',
              icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>'
            }
          ]
        }
      ]
    }
  },
  computed: {
    currentPath() {
      return this.$route.path
    },
    visibleMenuItems() {
      return this.menuItems.filter(item => {
        if (item.requiredPrivilege) {
          return this.privilege >= item.requiredPrivilege
        }
        return true
      })
    },
    pageTitle() {
      const currentPath = this.$route.path
      const findLabel = (items) => {
        for (const item of items) {
          if (item.path === currentPath) return item.label
          if (item.children) {
            const childLabel = findLabel(item.children)
            if (childLabel) return childLabel
          }
        }
        return ''
      }
      return findLabel(this.visibleMenuItems) || '系统管理'
    },
    avatarLetter() {
      return this.username ? this.username.trim().charAt(0).toUpperCase() : '·'
    },
    greetingIcon() {
      return getGreetingIcon(this.theme)
    }
  },
  created() {
    this.username = getUsername() || ''
    this.privilege = getPrivilege()
    this.theme = getTimeTheme()
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed
    },
    navigateTo(path) {
      if (this.$route.path !== path) {
        this.$router.push(path)
      }
    },
    backToHome() {
      this.$router.push('/')
    },
    handleUserCommand(command) {
      if (command === 'mine') {
        this.navigateTo('/system/mine')
      } else if (command === 'logout') {
        this.handleLogout()
      }
    },
    handleLogout() {
      ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        removeToken()
        removeUsername()
        removePrivilege()
        ElMessage({ message: '已退出登录！', type: 'success' })
        this.$router.push('/login')
      }).catch(() => {
        // 用户取消
      })
    }
  }
}
</script>

<style scoped>
.system-wrapper {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ===== 侧边栏：深海军蓝 ===== */
.sidebar {
  position: relative;
  width: 240px;
  background: var(--oc-sidebar-bg);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  flex-shrink: 0;
  overflow: hidden;
}

/* --- 侧边栏星星点缀（集中在菜单下方空白区，仅夜晚/傍晚显示） --- */
.sidebar-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: none;
}

.theme-night .sidebar-decor {
  display: block;
}

.theme-dusk .sidebar-decor {
  display: block;
  opacity: 0.6;
}

.sb-star {
  position: absolute;
  background: #fff;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  opacity: 0.5;
  animation: sb-star-twinkle ease-in-out infinite;
}

.sb-star.s1 { top: 52%; left: 18%; width: 5px; height: 5px; animation-duration: 3s; }
.sb-star.s2 { top: 58%; left: 62%; width: 8px; height: 8px; box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.35); animation-duration: 2.6s; animation-delay: 0.9s; }
.sb-star.s3 { top: 63%; left: 38%; width: 5px; height: 5px; animation-duration: 3.6s; animation-delay: 1.8s; }
.sb-star.s4 { top: 67%; left: 80%; width: 6px; height: 6px; animation-duration: 2.8s; animation-delay: 0.5s; }
.sb-star.s5 { top: 72%; left: 12%; width: 6px; height: 6px; animation-duration: 3.4s; animation-delay: 2.2s; }
.sb-star.s6 { top: 76%; left: 52%; width: 9px; height: 9px; background: var(--oc-cyan-300); box-shadow: 0 0 10px 2px rgba(6, 182, 212, 0.4); animation-duration: 3.1s; animation-delay: 1.3s; }
.sb-star.s7 { top: 81%; left: 30%; width: 5px; height: 5px; animation-duration: 2.5s; animation-delay: 0.2s; }
.sb-star.s8 { top: 84%; left: 70%; width: 5px; height: 5px; animation-duration: 3.8s; animation-delay: 2.6s; }

@keyframes sb-star-twinkle {
  0%, 100% {
    opacity: 0.15;
    transform: scale(0.85);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* 尊重系统减弱动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .sb-star,
  .sidebar-greet-icon,
  .icon-sun .rays {
    animation: none;
  }
}

.sidebar.collapsed {
  width: 64px;
}

/* 浅色主题下侧边栏与内容区加分隔线 */
.theme-morning .sidebar,
.theme-day .sidebar {
  border-right: 1px solid var(--oc-gray-200);
}

/* Logo 区 */
.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  flex-shrink: 0;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 0;
}

.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--oc-blue-500), var(--oc-cyan-500));
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  overflow: hidden;
  white-space: nowrap;
}

.brand-name {
  color: var(--oc-sidebar-text-strong);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
}

.brand-sub {
  color: var(--oc-sidebar-text-sub);
  font-size: 10px;
  letter-spacing: 2px;
  margin-top: 2px;
}

/* Logo 区时段图标 */
.sidebar-greet-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-left: 2px;
}

.icon-sun .rays {
  transform-box: fill-box;
  transform-origin: center;
  animation: sun-spin 30s linear infinite;
}

@keyframes sun-spin {
  to { transform: rotate(360deg); }
}

.icon-sunset {
  animation: sunset-glow 4s ease-in-out infinite;
}

@keyframes sunset-glow {
  0%, 100% { filter: drop-shadow(0 0 2px rgba(251, 146, 60, 0.4)); }
  50% { filter: drop-shadow(0 0 7px rgba(251, 146, 60, 0.75)); }
}

.icon-moon {
  animation: moon-glow 4s ease-in-out infinite;
}

@keyframes moon-glow {
  0%, 100% { filter: drop-shadow(0 0 2px rgba(253, 230, 138, 0.35)); }
  50% { filter: drop-shadow(0 0 7px rgba(253, 230, 138, 0.7)); }
}

/* 菜单 */
.sidebar-menu {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu::-webkit-scrollbar {
  width: 4px;
}
.sidebar-menu::-webkit-scrollbar-thumb {
  background: var(--oc-sidebar-border);
  border-radius: 2px;
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--oc-sidebar-text);
  transition: background 0.15s ease, color 0.15s ease;
  user-select: none;
}

.menu-item:hover {
  background: var(--oc-sidebar-hover-bg);
  color: var(--oc-sidebar-text-strong);
}

.menu-item.active {
  background: var(--oc-sidebar-active-bg);
  color: var(--oc-sidebar-text-strong);
  font-weight: 500;
}

/* 选中态左侧 3px 高亮条 */
.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 2px;
  background: var(--oc-blue-400);
}

.menu-item.active .menu-icon {
  color: var(--oc-sidebar-active-icon);
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.menu-text {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar.collapsed .menu-item {
  justify-content: center;
  padding: 0;
}

/* 分组标题（系统管理） */
.menu-group {
  display: flex;
  flex-direction: column;
}

.menu-group-title {
  padding: 0 12px;
  margin: 16px 0 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  color: var(--oc-sidebar-text-sub);
  white-space: nowrap;
}

/* 底部区 */
.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--oc-sidebar-border);
  flex-shrink: 0;
}

.sidebar-footer .menu-item:last-child {
  margin-bottom: 0;
}

.collapse-icon {
  transition: transform 0.2s ease;
}

.collapse-icon.reversed {
  transform: rotate(180deg);
}

/* ===== 主内容区 ===== */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--oc-content-bg);
}

/* 顶栏：56px，随时段主题换肤 */
.top-bar {
  height: 56px;
  background: var(--oc-topbar-bg);
  border-bottom: 1px solid var(--oc-topbar-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.top-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--oc-topbar-text);
}

/* 用户胶囊 */
.user-capsule {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.15s ease;
  outline: none;
}

.user-capsule:hover {
  background: var(--oc-topbar-capsule-hover);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--oc-blue-600);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  color: var(--oc-topbar-text);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capsule-arrow {
  font-size: 12px;
  color: var(--oc-topbar-text-secondary);
}

/* 内容区 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>

<!-- 下拉菜单渲染在 body 下，需非 scoped 覆盖 -->
<style>
.oc-user-dropdown.el-popper.is-light {
  border-radius: 12px;
}

.oc-user-dropdown .el-dropdown-menu {
  padding: 6px;
}

.oc-user-dropdown .el-dropdown-menu__item {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  gap: 6px;
}

.oc-user-dropdown .el-dropdown-menu__item.dropdown-item-danger {
  color: var(--oc-danger);
}

.oc-user-dropdown .el-dropdown-menu__item.dropdown-item-danger:hover {
  background: var(--oc-danger-bg);
  color: var(--oc-danger);
}
</style>
