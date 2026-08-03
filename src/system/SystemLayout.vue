<template>
  <div class="system-wrapper">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <span class="sidebar-logo" v-if="!isCollapsed">OCSKILL</span>
        <span class="sidebar-logo-mini" v-else>OC</span>
      </div>
      <nav class="sidebar-menu">
        <template v-for="(item, index) in visibleMenuItems" :key="item.path || item.label">
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

          <!-- 有子菜单 -->
          <div v-else class="menu-group">
            <div
              class="menu-item menu-item-parent"
              :class="{ active: isChildActive(item) }"
              @click="handleParentClick(item, index)"
            >
              <span class="menu-icon" v-html="item.icon"></span>
              <span class="menu-text" v-if="!isCollapsed">{{ item.label }}</span>
              <span v-if="!isCollapsed" class="menu-arrow" :class="{ up: isExpanded(index) }">&#9662;</span>
            </div>
            <div v-show="!isCollapsed && isExpanded(index)" class="sub-menu">
              <div
                v-for="child in item.children"
                :key="child.path"
                class="menu-item menu-item-child"
                :class="{ active: currentPath === child.path }"
                @click="navigateTo(child.path)"
              >
                <span class="menu-icon" v-html="child.icon"></span>
                <span class="menu-text">{{ child.label }}</span>
              </div>
            </div>
          </div>
        </template>
      </nav>
      <div class="sidebar-footer" v-if="!isCollapsed">
        <button class="btn-back-home" @click="backToHome">返回首页</button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <button class="btn-collapse" @click="toggleSidebar">
          <span v-if="isCollapsed">&#9776;</span>
          <span v-else>&#9776;</span>
        </button>
        <h1 class="top-title">{{ pageTitle }}</h1>
        <div class="top-right">
          <span class="top-username">用户: [{{ username }}]</span>
          <button class="btn-logout" @click="handleLogout">退出登录</button>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="content-area">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>

      <!-- 备案信息 
      <footer class="footer-record">
        <p>Copyright &copy; 2026 OCSKILL技术知识查询. All Rights Reserved.</p>
        <p>
          <a class="record-gongan" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44195402000128" target="_blank" rel="noopener noreferrer">
            <img src="../assets/gongan.png" alt="公安备案图标" />
            粤公网安备44195402000128号
          </a>
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
            粤ICP备2026082654号
          </a>
        </p>
      </footer>  -->
    </div>
  </div>
</template>

<script>
import { getUsername, getPrivilege, removeToken, removeUsername, removePrivilege } from '@/utils/token'

export default {
  name: 'SystemLayout',
  data() {
    return {
      isCollapsed: false,
      username: '',
      privilege: 1,
      expandedMenus: [],
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
    }
  },
  created() {
    this.username = getUsername() || ''
    this.privilege = getPrivilege()
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed
    },
    isExpanded(index) {
      return this.expandedMenus.includes(index)
    },
    isChildActive(item) {
      return item.children && item.children.some(child => child.path === this.currentPath)
    },
    handleParentClick(item, index) {
      if (this.isCollapsed) {
        // 折叠状态下直接跳转第一个可见子菜单
        if (item.children && item.children.length > 0) {
          this.navigateTo(item.children[0].path)
        }
        return
      }
      const pos = this.expandedMenus.indexOf(index)
      if (pos === -1) {
        this.expandedMenus.push(index)
      } else {
        this.expandedMenus.splice(pos, 1)
      }
    },
    navigateTo(path) {
      if (this.$route.path !== path) {
        this.$router.push(path)
      }
    },
    backToHome() {
      this.$router.push('/')
    },
    handleLogout() {
      removeToken()
      removeUsername()
      removePrivilege()
      this.$router.push('/login')
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

/* 侧边栏 */
.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #87CEEB 0%, #5FB0E6 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
  box-shadow: 2px 0 12px rgba(95, 176, 230, 0.3);
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.sidebar-logo {
  color: #1a3a6e;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
}

.sidebar-logo-mini {
  color: #1a3a6e;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-menu {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 48px;
  cursor: pointer;
  color: rgba(26, 58, 110, 0.85);
  transition: all 0.2s;
  gap: 12px;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #1a3a6e;
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.35);
  color: #1a3a6e;
  border-left: 3px solid #1a3a6e;
  padding-left: 21px;
  font-weight: 600;
}

.sidebar.collapsed .menu-item {
  justify-content: center;
  padding: 0;
}

.sidebar.collapsed .menu-item.active {
  padding-left: 0;
  border-left: none;
  border-bottom: 3px solid #1a3a6e;
}

.menu-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.menu-text {
  font-size: 14px;
  white-space: nowrap;
}

/* 子菜单 */
.menu-group {
  display: flex;
  flex-direction: column;
}

.menu-item-parent {
  justify-content: space-between;
}

.menu-item-parent .menu-text {
  flex: 1;
}

.menu-arrow {
  font-size: 12px;
  color: rgba(26, 58, 110, 0.7);
  transition: transform 0.2s;
  margin-left: auto;
}

.menu-arrow.up {
  transform: rotate(180deg);
}

.sub-menu {
  background: rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.menu-item-child {
  height: 42px;
  padding: 0 24px 0 56px;
  font-size: 13px;
}

.menu-item-child:hover {
  background: rgba(255, 255, 255, 0.2);
}

.menu-item-child.active {
  background: rgba(255, 255, 255, 0.35);
  border-left: 3px solid #1a3a6e;
  padding-left: 53px;
  font-weight: 600;
}

.sidebar.collapsed .sub-menu {
  display: none;
}

.sidebar.collapsed .menu-arrow {
  display: none;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-back-home {
  width: 100%;
  padding: 8px 0;
  font-size: 13px;
  color: #1a3a6e;
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(26, 58, 110, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back-home:hover {
  background: rgba(255, 255, 255, 0.4);
  color: #1a3a6e;
}

/* 主内容区 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
}

.top-bar {
  height: 60px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  gap: 16px;
}

.btn-collapse {
  background: none;
  border: 1px solid #d0dff0;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1a3a6e;
  font-size: 18px;
  transition: all 0.2s;
}

.btn-collapse:hover {
  background: #f0f5ff;
  border-color: #3584e4;
}

.top-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a3a6e;
  flex: 1;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.top-username {
  font-size: 14px;
  color: #1a3a6e;
}

.btn-logout {
  padding: 6px 16px;
  font-size: 13px;
  color: #1a5fb4;
  background: #fff;
  border: 1px solid #3584e4;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #f0f5ff;
  color: #14478a;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

/* 备案信息 */
.footer-record {
  text-align: center;
  padding: 12px 0;
  background: #f0f5ff;
  color: #1a5fb4;
  font-size: 12px;
  line-height: 1.6;
  flex-shrink: 0;
}

.footer-record p:last-child {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.footer-record a {
  color: #1a5fb4;
  text-decoration: none;
}

.footer-record a:hover {
  text-decoration: underline;
}

.record-gongan {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.record-gongan img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
</style>
