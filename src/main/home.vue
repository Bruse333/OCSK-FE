<template>
  <div class="page-wrapper">
    <header class="site-header">
      <h1 class="site-name">技术知识查询</h1>
      <div class="header-right">
        <span class="header-username">用户: [{{ username }}]</span>
        <el-button @click="handleLogout">退出登录</el-button>
      </div>
    </header>
    <div class="image-container">
      <img src="../assets/ocskill_web.png" alt="Display Image" />
      <div class="action-bar">
        <el-button type="success" size="large" class="btn-enter-system" @click="enterSystem">进入系统</el-button>
      </div>
    </div>
    <footer class="footer-record">
      <p>Copyright © 2026 OCSKILL技术知识查询. All Rights Reserved.</p>
      <p>
        <a class="record-gongan" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordCode=44195402000128" target="_blank" rel="noopener noreferrer">
          <img src="../assets/gongan.png" alt="公安备案图标" />
          粤公网安备44195402000128号
        </a>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
          粤ICP备2026082654号
        </a>
      </p>
    </footer>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsername, removeToken, removeUsername, removePrivilege, getPrivilege } from '@/utils/token'

export default {
  name: 'MainPage',
  data() {
    return {
      username: '',
      privilege: 1
    }
  },
  created() {
    this.username = getUsername() || ''
    this.privilege = getPrivilege()
  },
  methods: {
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
    },
    enterSystem() {
      this.$router.push('/system/retrieval')
    }
  }
}
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-header {
  background: var(--oc-primary-bg, #f0f5ff);
  padding: 14px 24px;
  text-align: center;
  border-bottom: 1px solid var(--oc-border, #d0dff0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.site-name {
  margin: 0;
  color: var(--oc-title, #1a3a6e);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 3px;
}

.header-right {
  position: absolute;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-username {
  color: var(--oc-title, #1a3a6e);
  font-size: 14px;
  font-weight: 500;
}

.image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.action-bar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 16px;
}

/* 进入系统按钮：保留绿色渐变，与主色按钮区分 */
.btn-enter-system {
  padding: 12px 40px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  letter-spacing: 2px !important;
  background: linear-gradient(135deg, var(--oc-success, #19be6b), #0ea557) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(25, 190, 107, 0.35) !important;
}

.btn-enter-system:hover {
  background: linear-gradient(135deg, #0ea557, #078c47) !important;
  box-shadow: 0 6px 18px rgba(25, 190, 107, 0.45) !important;
}

.footer-record {
  text-align: center;
  padding: 12px 0;
  background: var(--oc-primary-bg, #f0f5ff);
  color: var(--oc-primary-dark, #1a5fb4);
  font-size: 12px;
  line-height: 1.6;
}

.footer-record p:last-child {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.footer-record a {
  color: var(--oc-primary-dark, #1a5fb4);
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
