<template>
  <div class="login-h5">
    <!-- 品牌区（顶部 40%） -->
    <section class="brand-zone">
      <div class="brand-row">
        <span class="brand-mark">OC</span>
        <span class="brand-name">OCSKILL</span>
      </div>
      <h1 class="brand-title">技术知识查询系统</h1>
      <p class="brand-subtitle">让技能点亮未来 —— 船舶故障排查知识库</p>
    </section>

    <!-- 表单区（圆角上叠） -->
    <section class="form-zone">
      <h2 class="form-title">欢迎登录</h2>
      <p class="form-subtitle">请使用账号密码登录系统</p>

      <form @submit.prevent="handleLogin()">
        <div class="form-group">
          <label for="username">用户名</label>
          <input id="username" v-model="loginForm.username" type="text" placeholder="请输入用户名" required />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input id="password" v-model="loginForm.password" type="password" placeholder="请输入密码" autocomplete="off" required />
        </div>
        <button type="submit" class="btn-login" :disabled="loading">{{ loading ? '登录中…' : '登录' }}</button>
        <div class="guest-link" @click="handleGuestLogin">游客登录</div>
      </form>
    </section>

    <footer class="page-footer">
      <p>&copy; 2026 OCSKILL &middot; 技术知识查询系统</p>
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
      },
      loading: false
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
.login-h5 {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--oc-gray-50);
}

/* 品牌区：深蓝渐变，约 40% 高度 */
.brand-zone {
  min-height: 38vh;
  background:
    radial-gradient(circle at 82% 12%, rgba(6, 182, 212, 0.25), transparent 55%),
    linear-gradient(160deg, var(--oc-navy-950) 0%, var(--oc-navy-800) 55%, #14418C 100%);
  padding: 48px 24px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--oc-blue-500), var(--oc-cyan-500));
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
}

.brand-title {
  margin: 0;
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
}

.brand-subtitle {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

/* 表单区：白色圆角上叠 */
.form-zone {
  flex: 1;
  background: #fff;
  border-radius: 20px 20px 0 0;
  margin-top: -20px;
  padding: 28px 24px 24px;
  position: relative;
  z-index: 1;
}

.form-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--oc-gray-900);
}

.form-subtitle {
  margin: 6px 0 24px;
  font-size: 13px;
  color: var(--oc-gray-400);
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--oc-gray-700);
}

.form-group input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  font-size: 16px;
  border: 1px solid var(--oc-gray-200);
  border-radius: 8px;
  outline: none;
  color: var(--oc-gray-900);
  background: var(--oc-gray-100);
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.form-group input:focus {
  border-color: var(--oc-blue-600);
  background: #fff;
  box-shadow: 0 0 0 3px var(--oc-blue-100);
}

.form-group input::placeholder {
  color: var(--oc-gray-400);
}

.btn-login {
  width: 100%;
  height: 44px;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--oc-blue-600);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  letter-spacing: 4px;
  transition: background 0.15s ease;
}

.btn-login:active {
  background: var(--oc-blue-700);
}

.btn-login:disabled {
  background: var(--oc-gray-300);
  cursor: not-allowed;
}

.guest-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: var(--oc-blue-600);
  cursor: pointer;
}

/* 页脚 */
.page-footer {
  text-align: center;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  font-size: 11px;
  color: var(--oc-gray-400);
  line-height: 1.8;
}

.page-footer p {
  margin: 2px 0;
}

.page-footer a {
  color: var(--oc-gray-400);
  text-decoration: none;
  word-break: break-all;
}

.record-gongan {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.record-gongan img {
  width: 12px;
  height: 12px;
  object-fit: contain;
}
</style>
