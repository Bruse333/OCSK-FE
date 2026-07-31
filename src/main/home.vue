<template>
  <div class="page-wrapper">
    <header class="site-header">
      <h1 class="site-name">技术知识查询</h1>
      <div class="header-right">
        <span class="header-username">用户: [{{ username }}]</span>
        <button class="btn-logout" @click="handleLogout">退出登录</button>
      </div>
    </header>
    <div class="image-container">
      <img src="../assets/ocskill_web.png" alt="Display Image" />
      <div class="action-bar">
        <button class="btn-primary btn-enter-system" @click="enterSystem">进入系统</button>
      </div>
    </div>
    <footer class="footer-record">
      <p>Copyright © 2026 OCSKILL技术知识查询. All Rights Reserved.</p>
      <p>
        <a class="record-gongan" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44195402000128" target="_blank" rel="noopener noreferrer">
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
      removeToken()
      removeUsername()
      removePrivilege()
      this.$router.push('/login')
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
  background: #f0f5ff;
  padding: 14px 24px;
  text-align: center;
  border-bottom: 1px solid #d0dff0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.site-name {
  margin: 0;
  color: #1a3a6e;
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
  color: #1a3a6e;
  font-size: 14px;
  font-weight: 500;
}

.btn-logout {
  padding: 6px 14px;
  font-size: 13px;
  color: #1a5fb4;
  background: #fff;
  border: 1px solid #3584e4;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-logout:hover {
  background: #f0f5ff;
  color: #14478a;
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

.btn-enter-system {
  background: linear-gradient(135deg, #19be6b, #0ea557);
  box-shadow: 0 2px 8px rgba(25, 190, 107, 0.3);
}

.btn-enter-system:hover {
  background: linear-gradient(135deg, #0ea557, #078c47);
  box-shadow: 0 4px 12px rgba(25, 190, 107, 0.4);
}

.btn-primary {
  padding: 10px 32px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  letter-spacing: 1px;
  transition: background 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(26, 95, 180, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
  box-shadow: 0 4px 12px rgba(26, 95, 180, 0.4);
}

.footer-record {
  text-align: center;
  padding: 12px 0;
  background: #f0f5ff;
  color: #1a5fb4;
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
