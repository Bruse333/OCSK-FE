<template>
  <div class="h5-system-wrapper">
    <!-- 顶部栏 -->
    <header class="h5-top-bar">
      <button class="h5-back-btn" @click="backToHome">&#8249;</button>
      <h1 class="h5-top-title">{{ pageTitle }}</h1>
      <button class="h5-top-logout" @click="handleLogout">退出</button>
    </header>

    <!-- 内容区 -->
    <main class="h5-content">
      <router-view />
    </main>

    <!-- 底部 TabBar -->
    <nav class="h5-tab-bar">
      <div
        v-for="item in tabItems"
        :key="item.path"
        class="h5-tab-item"
        :class="{ active: currentPath === item.path }"
        @click="navigateTo(item.path)"
      >
        <span class="h5-tab-icon" v-html="item.icon"></span>
        <span class="h5-tab-label">{{ item.label }}</span>
      </div>
    </nav>
  </div>
</template>

<script>
import { getUsername, removeToken, removeUsername, removePrivilege } from '@/utils/token'

export default {
  name: 'SystemLayoutH5',
  data() {
    return {
      username: '',
      tabItems: [
        {
          label: '检索',
          path: '/system/retrieval',
          icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
        },
        {
          label: '添加',
          path: '/system/add',
          icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>'
        },
        {
          label: '我的',
          path: '/system/mine',
          icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        }
      ]
    }
  },
  computed: {
    currentPath() {
      return this.$route.path
    },
    pageTitle() {
      const item = this.tabItems.find(t => t.path === this.$route.path)
      return item ? item.label : '系统'
    }
  },
  created() {
    this.username = getUsername() || ''
  },
  methods: {
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
.h5-system-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--oc-bg, #f5f7fa);
}

/* 顶部栏 */
.h5-top-bar {
  height: 50px;
  background: linear-gradient(135deg, var(--oc-primary, #3584e4), var(--oc-primary-dark, #1a5fb4));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  flex-shrink: 0;
  color: #fff;
}

.h5-back-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 22px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.h5-top-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.h5-top-logout {
  padding: 5px 10px;
  font-size: 13px;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
}

/* 内容区 */
.h5-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px;
  padding-bottom: 70px;
}

/* 底部 TabBar */
.h5-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  border-top: 1px solid var(--oc-border, #e8ecf0);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);
}

.h5-tab-item {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--oc-text-light, #999);
  cursor: pointer;
  transition: all 0.2s;
}

.h5-tab-item.active {
  color: var(--oc-primary-dark, #1a5fb4);
}

.h5-tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.h5-tab-label {
  font-size: 11px;
}
</style>
