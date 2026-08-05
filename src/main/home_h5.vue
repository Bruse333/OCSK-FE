<template>
  <div class="home-h5" :class="'theme-' + theme">
    <!-- 品牌区 -->
    <section class="hero-zone">
      <!-- 背景装饰：星星/流星（夜）+ 白云（昼）+ 落日飞鸟（傍晚） -->
      <div class="hero-decor" aria-hidden="true">
        <span
          v-for="(star, idx) in stars"
          :key="'star' + idx"
          class="star"
          :class="star.sizeClass"
          :style="star.style"
        />
        <span class="meteor"></span>
        <!-- 白云（清晨/白日） -->
        <svg class="cloud cloud-1" viewBox="0 0 80 36" fill="#fff">
          <ellipse cx="22" cy="25" rx="16" ry="9"/><ellipse cx="42" cy="17" rx="18" ry="12"/><ellipse cx="62" cy="25" rx="14" ry="8"/>
        </svg>
        <svg class="cloud cloud-2" viewBox="0 0 80 36" fill="#fff">
          <ellipse cx="22" cy="25" rx="16" ry="9"/><ellipse cx="42" cy="17" rx="18" ry="12"/><ellipse cx="62" cy="25" rx="14" ry="8"/>
        </svg>
        <!-- 半沉落日 + 剪影飞鸟（傍晚） -->
        <div class="dusk-sun"></div>
        <svg class="bird" viewBox="0 0 32 12" fill="none" stroke-linecap="round">
          <path d="M2 10 Q9 2 16 10 Q23 2 30 10"/>
        </svg>
      </div>
      <div class="hero-top">
        <div class="brand-row">
          <span class="brand-mark">OC</span>
          <span class="brand-name">OCSKILL</span>
        </div>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </div>
      <p class="hero-greeting">
        <!-- 明亮太阳（清晨/白日） -->
        <svg v-if="greetingIcon === 'sun'" class="greet-icon icon-sun" viewBox="0 0 24 24" fill="none">
          <g class="rays" stroke="#F59E0B" stroke-width="2" stroke-linecap="round">
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>
          </g>
          <circle cx="12" cy="12" r="4.5" fill="#FBBF24"/>
        </svg>
        <!-- 黄昏太阳（傍晚） -->
        <svg v-else-if="greetingIcon === 'sunset'" class="greet-icon icon-sunset" viewBox="0 0 24 24" fill="none">
          <g stroke="#FDBA74" stroke-width="2" stroke-linecap="round">
            <path d="M12 3.5v2M5.2 7.2l1.5 1.5M18.8 7.2l-1.5 1.5"/>
          </g>
          <path d="M7 16a5 5 0 0 1 10 0Z" fill="#FB923C"/>
          <path d="M3 16h18" stroke="#FDBA74" stroke-width="2" stroke-linecap="round"/>
          <path d="M7 20h10" stroke="#FDBA74" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        </svg>
        <!-- 弯月（夜晚） -->
        <svg v-else class="greet-icon icon-moon" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" fill="#FDE68A"/>
          <circle cx="17.5" cy="5" r="1" fill="#FDE68A" opacity=".85"/>
        </svg>
        <span>{{ greeting }}，{{ username }}</span>
      </p>
      <h1 class="hero-title">技术知识查询系统</h1>
      <p class="hero-subtitle">让技能点亮未来 —— 船舶故障排查知识库</p>
    </section>

    <!-- 操作区（圆角上叠） -->
    <section class="action-zone">
      <button class="btn-primary" @click="enterSystem">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        进入系统
      </button>
      <button class="btn-secondary" @click="openModal" v-if="privilege === 3">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/>
        </svg>
        新增用户
      </button>
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

    <!-- 新增用户模态框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h2>新增用户</h2>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="username">用户名 <span class="required">*</span></label>
            <input id="username" v-model="form.username" type="text" placeholder="请输入用户名" required />
          </div>
          <div class="form-group">
            <label for="password">密码 <span class="required">*</span></label>
            <input id="password" v-model="form.password" type="text" placeholder="请输入密码" autocomplete="off" required />
          </div>
          <div class="form-group">
            <label for="name">姓名 <span class="required">*</span></label>
            <input id="name" v-model="form.name" type="text" placeholder="请输入姓名" required />
          </div>
          <div class="form-group">
            <label for="privilege">权限设置</label>
            <select id="privilege" v-model="form.privilege">
              <option :value="1">仅查询</option>
              <option :value="2">查询与修改</option>
              <option :value="3">所有权限</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">取消</button>
            <button type="submit" class="btn-submit">提交</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 提示弹框 -->
    <transition name="fade">
      <div v-if="alertBox.show" class="alert-overlay" @click.self="closeAlert">
        <div class="alert-dialog">
          <p class="alert-msg">{{ alertBox.msg }}</p>
          <button class="alert-btn" @click="closeAlert">确定</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import request from '@/utils/request'
import { getUsername, getPrivilege, removeToken, removeUsername, removePrivilege } from '@/utils/token'
import { getTimeTheme, getGreeting, getGreetingIcon } from '@/utils/theme'
import { ElNotification } from 'element-plus'

export default {
  name: 'MainPageH5',
  data() {
    return {
      username: '',
      privilege: 1,
      showModal: false,
      form: {
        username: '',
        password: '',
        name: '',
        privilege: 1
      },
      alertBox: {
        show: false,
        msg: ''
      },
      stars: [],
      theme: 'night'
    }
  },
  computed: {
    greeting() {
      return getGreeting()
    },
    greetingIcon() {
      return getGreetingIcon(this.theme)
    }
  },
  created() {
    this.username = getUsername() || ''
    this.privilege = getPrivilege()
    this.stars = this.generateStars()
    this.theme = getTimeTheme()
  },
  methods: {
    handleLogout() {
      removeToken()
      removeUsername()
      removePrivilege()
      this.$router.push('/login')
    },
    generateStars() {
      // 品牌区空间小：星星主要分布在右侧和顶部留白，避开左侧标题文字
      const positions = [
        { top: 10, left: 56 }, { top: 7, left: 74 }, { top: 14, left: 88 },
        { top: 26, left: 92 }, { top: 30, left: 80 }, { top: 38, left: 94 },
        { top: 50, left: 88 }, { top: 58, left: 72 }, { top: 66, left: 84 },
        { top: 70, left: 60 }, { top: 22, left: 66 }, { top: 60, left: 95 }
      ]
      return positions.map((p, i) => {
        const sizeClass = i % 3 === 0 ? 'star-lg' : i % 3 === 1 ? 'star-md' : 'star-sm'
        const duration = 2.4 + Math.random() * 2.4
        const delay = Math.random() * 4
        return {
          sizeClass,
          style: {
            top: p.top + '%',
            left: p.left + '%',
            animationDuration: duration.toFixed(2) + 's',
            animationDelay: delay.toFixed(2) + 's'
          }
        }
      })
    },
    enterSystem() {
      this.$router.push('/system/retrieval')
    },
    openModal() {
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.resetForm()
    },
    resetForm() {
      this.form = {
        username: '',
        password: '',
        name: '',
        privilege: 1
      }
    },
    showAlert(msg) {
      this.alertBox.msg = msg
      this.alertBox.show = true
    },
    closeAlert() {
      this.alertBox.show = false
    },
    async handleSubmit() {
      const payload = {
        username: this.form.username,
        password: this.form.password,
        name: this.form.name,
        privilege: this.form.privilege
      }
      try {
        const res = await request.post('/users', payload)
        if (res.data.code === 0) {
          this.showAlert(res.data.msg || '提交失败')
        } else {
          this.showAlert('提交成功')
          this.closeModal()
        }
      } catch (err) {
        console.error('提交失败:', err)
        if (err.response?.status === 401) {
          removeToken()
          removeUsername()
          removePrivilege()
          this.$router.push('/login')
        } else {
          this.showAlert('提交失败，请重试')
        }
      }
    }
  }
}
</script>

<style scoped>
.home-h5 {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--oc-gray-50);
}

/* 品牌区：时段主题渐变 */
.hero-zone {
  min-height: 34vh;
  background: var(--oc-hero-bg);
  padding: 16px 20px 52px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

/* --- 背景装饰层：星星 + 流星 --- */
.hero-decor {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.star {
  position: absolute;
  background: #fff;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  opacity: 0.55;
  animation: star-twinkle ease-in-out infinite;
}

.star-sm {
  width: 5px;
  height: 5px;
  box-shadow: 0 0 6px 1px rgba(255, 255, 255, 0.35);
}

.star-md {
  width: 8px;
  height: 8px;
  box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.45);
}

.star-lg {
  width: 10px;
  height: 10px;
  box-shadow: 0 0 14px 3px rgba(6, 182, 212, 0.45);
  background: var(--oc-cyan-300);
}

@keyframes star-twinkle {
  0%, 100% {
    opacity: 0.25;
    transform: scale(0.85);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.1);
  }
}

.meteor {
  position: absolute;
  top: 16%;
  left: 62%;
  width: 90px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.6));
  transform: rotate(-35deg);
  opacity: 0;
  animation: meteor-fall 11s linear infinite;
  animation-delay: 3s;
}

.meteor::after {
  content: '';
  position: absolute;
  left: -2px;
  top: -2px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.8);
}

@keyframes meteor-fall {
  0% {
    opacity: 0;
    transform: rotate(-35deg) translateX(0);
  }
  2% {
    opacity: 1;
  }
  9% {
    opacity: 0;
    transform: rotate(-35deg) translateX(-260px);
  }
  100% {
    opacity: 0;
    transform: rotate(-35deg) translateX(-260px);
  }
}

/* --- 白云（清晨/白日） --- */
.cloud {
  position: absolute;
  display: none;
  opacity: 0.85;
  animation: cloud-drift linear infinite;
}

.cloud-1 { top: 12%; width: 72px; animation-duration: 60s; }
.cloud-2 { top: 34%; width: 52px; opacity: 0.65; animation-duration: 80s; animation-delay: -35s; }

@keyframes cloud-drift {
  from { transform: translateX(-30vw); }
  to { transform: translateX(120vw); }
}

/* --- 半沉落日 + 剪影飞鸟（傍晚） --- */
.dusk-sun {
  position: absolute;
  display: none;
  right: 10%;
  bottom: 6px;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, #FDBA74, #F97316 72%);
  box-shadow: 0 0 34px 14px rgba(249, 115, 22, 0.4);
  animation: dusk-sun-breathe 5s ease-in-out infinite;
}

@keyframes dusk-sun-breathe {
  0%, 100% { box-shadow: 0 0 34px 14px rgba(249, 115, 22, 0.4); }
  50% { box-shadow: 0 0 46px 20px rgba(249, 115, 22, 0.55); }
}

.bird {
  position: absolute;
  display: none;
  top: 20%;
  width: 24px;
  stroke: rgba(30, 27, 75, 0.8);
  stroke-width: 2.2;
  opacity: 0;
  animation: bird-fly 24s linear infinite;
  animation-delay: 5s;
}

@keyframes bird-fly {
  0% { transform: translate(-10vw, 0); opacity: 0; }
  3% { opacity: 0.85; }
  42% { opacity: 0.85; }
  46% { transform: translate(112vw, -14px); opacity: 0; }
  100% { transform: translate(112vw, -14px); opacity: 0; }
}

/* --- 主题显隐规则 --- */
.theme-morning .star,
.theme-morning .meteor,
.theme-day .star,
.theme-day .meteor {
  display: none;
}

.theme-morning .cloud,
.theme-day .cloud {
  display: block;
}

.theme-dusk .meteor {
  display: none;
}

.theme-dusk .star {
  opacity: 0.3;
}

.theme-dusk .dusk-sun,
.theme-dusk .bird {
  display: block;
}

/* --- 问候语图标 --- */
.greet-icon {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
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

/* 尊重系统减弱动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .star,
  .meteor,
  .cloud,
  .dusk-sun,
  .bird,
  .greet-icon,
  .icon-sun .rays {
    animation: none;
  }
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.hero-greeting,
.hero-title,
.hero-subtitle {
  position: relative;
  z-index: 1;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--oc-blue-500), var(--oc-cyan-500));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  color: var(--oc-hero-text);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
}

.btn-logout {
  padding: 5px 12px;
  font-size: 12px;
  color: var(--oc-hero-btn-text);
  background: var(--oc-hero-btn-bg);
  border: 1px solid var(--oc-hero-btn-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-logout:active {
  background: var(--oc-hero-capsule-hover);
}

.hero-greeting {
  margin: 0 0 8px;
  color: var(--oc-hero-text);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.hero-title {
  margin: 0;
  color: var(--oc-hero-text);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
}

.hero-subtitle {
  margin: 8px 0 0;
  color: var(--oc-hero-text-secondary);
  font-size: 12px;
}

/* 操作区：白色圆角上叠 */
.action-zone {
  flex: 1;
  background: #fff;
  border-radius: 20px 20px 0 0;
  margin-top: -20px;
  padding: 28px 20px 24px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 1px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-primary {
  color: #fff;
  background: var(--oc-blue-600);
  border: none;
}

.btn-primary:active {
  background: var(--oc-blue-700);
}

.btn-secondary {
  color: var(--oc-blue-600);
  background: #fff;
  border: 1px solid var(--oc-blue-600);
}

.btn-secondary:active {
  background: var(--oc-blue-50);
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

/* 模态框：白色头部 + 底部细线 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-dialog {
  background: #fff;
  border-radius: 16px;
  width: 92vw;
  max-width: 400px;
  box-shadow: var(--oc-shadow-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid var(--oc-gray-200);
}

.modal-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--oc-gray-900);
}

.modal-close {
  background: none;
  border: none;
  color: var(--oc-gray-400);
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.modal-close:active {
  color: var(--oc-gray-700);
}

.modal-dialog form {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--oc-gray-700);
}

.required {
  color: var(--oc-danger);
}

.form-group input,
.form-group select {
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

.form-group input:focus,
.form-group select:focus {
  border-color: var(--oc-blue-600);
  background: #fff;
  box-shadow: 0 0 0 3px var(--oc-blue-100);
}

.form-group input::placeholder {
  color: var(--oc-gray-400);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--oc-gray-700);
  background: #fff;
  border: 1px solid var(--oc-gray-200);
  border-radius: 8px;
  cursor: pointer;
}

.btn-cancel:active {
  background: var(--oc-gray-100);
}

.btn-submit {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: var(--oc-blue-600);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-submit:active {
  background: var(--oc-blue-700);
}

/* 提示弹框 */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.alert-dialog {
  background: #fff;
  border-radius: 16px;
  width: 80vw;
  max-width: 320px;
  box-shadow: var(--oc-shadow-lg);
  overflow: hidden;
}

.alert-msg {
  margin: 0;
  padding: 28px 20px;
  font-size: 15px;
  color: var(--oc-gray-900);
  text-align: center;
  line-height: 1.6;
}

.alert-btn {
  display: block;
  width: 100%;
  padding: 12px 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--oc-blue-600);
  background: #fff;
  border: none;
  border-top: 1px solid var(--oc-gray-200);
  cursor: pointer;
}

.alert-btn:active {
  background: var(--oc-gray-100);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
