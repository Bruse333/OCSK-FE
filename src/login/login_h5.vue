<template>
  <div class="page-wrapper">
    <header class="site-header">
      <h1 class="site-name">技术知识查询</h1>
    </header>
    <div class="image-container">
      <img src="../assets/ocskill_h5.png" alt="Login Background" />
      <div class="login-panel">
        <h2 class="login-title">用户登录</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="username">用户名</label>
            <input id="username" v-model="loginForm.username" type="text" placeholder="请输入用户名" required />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input id="password" v-model="loginForm.password" type="password" placeholder="请输入密码" autocomplete="off" required />
          </div>
          <button type="submit" class="btn-login">登录</button>
          <el-link type="primary" @click="handleGuestLogin">游客登陆</el-link>
        </form>
      </div>
    </div>
    <footer class="footer-record">
      <p>Copyright &copy; 2026 OCSKILL技术知识查询.</p>
      <p>
        <a class="record-gongan" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44195402000128" target="_blank" rel="noopener noreferrer">
          <img src="../assets/gongan.png" alt="公安备案图标" />
          粤公网安备44195402000128号
        </a>
      </p>
      <p>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
          粤ICP备2026082654号
        </a>
      </p>
    </footer>
  </div>
</template>

<script>
import request from '@/utils/request'
import { setToken, setUsername, setPrivilege } from '@/utils/token'
import { ElMessage } from 'element-plus'

export default {
  name: 'LoginPageH5',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      }
    }
  },
  methods: {
    async handleLogin(username, password) {
      if (!username || !password) {
        username = this.loginForm.username
        password = this.loginForm.password
      }
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
            duration: 1000
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
      }
    },
    handleGuestLogin() {
      this.handleLogin('cust', 'yz2010')
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
  padding: 10px 16px;
  text-align: center;
  border-bottom: 1px solid #d0dff0;
}

.site-name {
  margin: 0;
  color: #1a3a6e;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
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

.login-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 28px 24px;
  width: 85vw;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(26, 58, 110, 0.25);
  backdrop-filter: blur(8px);
}

.login-title {
  margin: 0 0 22px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a3a6e;
  text-align: center;
  letter-spacing: 2px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #1a3a6e;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid #c8daf0;
  border-radius: 6px;
  outline: none;
  color: #1a3a6e;
  background: #f8fbff;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #3584e4;
  box-shadow: 0 0 0 2px rgba(53, 132, 228, 0.2);
}

.form-group input::placeholder {
  color: #a0b8d8;
}

.btn-login {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  letter-spacing: 2px;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(26, 95, 180, 0.3);
}


.btn-login:active {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
}

.footer-record {
  text-align: center;
  padding: 8px 8px;
  background: #f0f5ff;
  color: #1a5fb4;
  font-size: 11px;
  line-height: 1.6;
}

.footer-record p {
  margin: 2px 0;
}

.footer-record a {
  color: #1a5fb4;
  text-decoration: none;
  word-break: break-all;
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
</style>
