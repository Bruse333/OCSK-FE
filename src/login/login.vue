<template>
  <div class="login-wrapper">
    <!-- 左侧品牌区 -->
    <section class="brand-pane">
      <div class="brand-content">
        <div class="brand-row">
          <span class="brand-mark">OC</span>
          <span class="brand-name">OCSKILL</span>
        </div>
        <h1 class="brand-title">技术知识查询系统</h1>
        <p class="brand-subtitle">让技能点亮未来 —— 船舶故障排查知识库</p>
        <ul class="feature-list">
          <li class="feature-item" v-for="item in features" :key="item.text">
            <span class="feature-icon" v-html="item.icon"></span>
            <span class="feature-text">{{ item.text }}</span>
          </li>
        </ul>
      </div>

      <!-- 小程序码 -->
      <div class="mini-qr">
        <img class="mini-qr-img" src="../assets/MiniMessenger.jpg" alt="小程序码" />
        <div class="mini-qr-text">
          <p>扫码使用小程序</p>
          <p class="mini-qr-sub">移动端随时查询</p>
        </div>
      </div>
    </section>

    <!-- 右侧登录区 -->
    <section class="form-pane">
      <div class="login-form">
        <h2 class="form-title">欢迎登录</h2>
        <p class="form-subtitle">请使用账号密码登录系统</p>

        <form @submit.prevent="handleLogin()">
          <div class="form-group">
            <label for="username">用户名</label>
            <el-input
              id="username"
              v-model="loginForm.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              size="large"
              clearable
            />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <el-input
              id="password"
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
              show-password
              autocomplete="off"
            />
          </div>
          <el-button
            type="primary"
            native-type="submit"
            size="large"
            class="btn-login"
            :loading="loading"
          >登录</el-button>
          <div class="guest-link">
            <el-link type="primary" :underline="false" @click="handleGuestLogin">游客登录</el-link>
          </div>
        </form>
      </div>

      <footer class="page-footer">
        <p>&copy; 2026 OCSKILL &middot; 技术知识查询系统</p>
        <p class="record-links">
          <a class="record-gongan" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44195402000128"
            target="_blank" rel="noopener noreferrer">
            <img src="../assets/gongan.png" alt="公安备案图标" />
            粤公网安备44195402000128号
          </a>
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
            粤ICP备2026082654号
          </a>
        </p>
      </footer>
    </section>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { setToken, setUsername, setPrivilege } from '@/utils/token'

export default {
  name: 'LoginPage',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loading: false,
      User: markRaw(User),
      Lock: markRaw(Lock),
      features: [
        {
          text: '故障记录结构化检索',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
        },
        {
          text: '可视化排查流程引导',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 6h9M6.2 8.2l4 7.3M17.8 8.2l-4 7.3"/></svg>'
        },
        {
          text: '批量导入与数据统计',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>'
        }
      ]
    }
  },
  methods: {
    async handleLogin(username, password) {
      if (!username || !password) {
        username = this.loginForm.username
        password = this.loginForm.password
      }
      if (this.loading) return
      this.loading = true
      try {
        const res = await request.post('/login', {
          username: username,
          password: password
        })
        if (res.data.code === 1) {
          setToken(res.data.data.token)
          setUsername(res.data.data.username)
          setPrivilege(res.data.data.privilege || 1)
          ElMessage({
            message: '登录成功！',
            type: 'success',
            duration: 1500
          })
          setTimeout(() => {
            this.$router.push('/')
          }, 1500)
        } else {
          ElMessage({
            message: res.data.msg || '登录失败',
            type: 'error',
            duration: 1500
          })
        }
      } catch (err) {
        console.error('登录失败:', err)
        ElMessage({
          message: '登录失败，请重试',
          type: 'error',
          duration: 1500
        })
      } finally {
        this.loading = false
      }
    },
    handleGuestLogin() {
      this.handleLogin('cust', 'yz2010')
    }
  }
}
</script>

<style scoped>
.login-wrapper {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ===== 左侧品牌区（55%） ===== */
.brand-pane {
  width: 55%;
  position: relative;
  background:
    radial-gradient(circle at 78% 18%, rgba(6, 182, 212, 0.28), transparent 55%),
    linear-gradient(160deg, var(--oc-navy-950) 0%, var(--oc-navy-800) 55%, #14418C 100%);
  display: flex;
  align-items: center;
  overflow: hidden;
}

/* 48px 网格线装饰 */
.brand-pane::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

.brand-content {
  position: relative;
  margin-left: 8%;
  max-width: 520px;
  padding-bottom: 4vh;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 40px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--oc-blue-500), var(--oc-cyan-500));
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name {
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 2px;
}

.brand-title {
  margin: 0;
  color: #fff;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 1px;
}

.brand-subtitle {
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

.feature-list {
  list-style: none;
  margin: 40px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feature-icon {
  display: flex;
  align-items: center;
  color: var(--oc-cyan-500);
  flex-shrink: 0;
}

.feature-text {
  color: #fff;
  font-size: 14px;
}

/* 小程序码：左下角 */
.mini-qr {
  position: absolute;
  left: 8%;
  bottom: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1;
}

.mini-qr-img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: #fff;
  padding: 4px;
  box-sizing: border-box;
  object-fit: contain;
  flex-shrink: 0;
}

.mini-qr-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mini-qr-text p {
  margin: 0;
  color: #fff;
  font-size: 12px;
}

.mini-qr-text .mini-qr-sub {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

/* ===== 右侧登录区（45%） ===== */
.form-pane {
  width: 45%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.login-form {
  width: 360px;
  max-width: calc(100% - 64px);
}

.form-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--oc-gray-900);
}

.form-subtitle {
  margin: 8px 0 32px;
  font-size: 13px;
  color: var(--oc-gray-400);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--oc-gray-700);
}

/* 输入框 44px 高 */
.form-group :deep(.el-input__wrapper) {
  height: 44px;
  padding: 0 14px;
  box-sizing: border-box;
}

.form-group :deep(.el-input__prefix) {
  color: var(--oc-gray-400);
}

.btn-login {
  width: 100%;
  height: 44px;
  margin-top: 8px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 4px;
}

.guest-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}

/* 页脚版权行 */
.page-footer {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: var(--oc-gray-400);
  line-height: 1.8;
}

.page-footer p {
  margin: 0;
}

.record-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-footer a {
  color: var(--oc-gray-400);
  text-decoration: none;
}

.page-footer a:hover {
  color: var(--oc-blue-600);
}

.record-gongan {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.record-gongan img {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

/* 窄屏兜底：收起品牌区 */
@media (max-width: 900px) {
  .brand-pane {
    display: none;
  }
  .form-pane {
    width: 100%;
  }
}
</style>
