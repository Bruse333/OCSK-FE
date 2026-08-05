<template>
  <div class="home-wrapper" :class="'theme-' + theme">
    <!-- 背景装饰：声呐波纹 + 星空/流星（夜）+ 白云（昼）+ 落日飞鸟（傍晚）+ 底部海浪 -->
    <div class="bg-decor" aria-hidden="true">
      <!-- 声呐波纹：右上 / 左下 各一组 -->
      <div class="sonar sonar-tr">
        <span v-for="i in 4" :key="'tr' + i" class="sonar-ring" :style="{ animationDelay: (i - 1) * 1.5 + 's' }"></span>
        <span class="sonar-dot"></span>
      </div>
      <div class="sonar sonar-bl">
        <span v-for="i in 4" :key="'bl' + i" class="sonar-ring" :style="{ animationDelay: (i - 1) * 1.5 + 0.75 + 's' }"></span>
        <span class="sonar-dot"></span>
      </div>
      <!-- 散布小星星 -->
      <span
        v-for="(star, idx) in stars"
        :key="'star' + idx"
        class="star"
        :class="star.sizeClass"
        :style="star.style"
      />
      <!-- 偶发流星 -->
      <span class="meteor meteor-1"></span>
      <span class="meteor meteor-2"></span>
      <!-- 白云（清晨/白日） -->
      <svg class="cloud cloud-1" viewBox="0 0 80 36" fill="#fff">
        <ellipse cx="22" cy="25" rx="16" ry="9"/><ellipse cx="42" cy="17" rx="18" ry="12"/><ellipse cx="62" cy="25" rx="14" ry="8"/>
      </svg>
      <svg class="cloud cloud-2" viewBox="0 0 80 36" fill="#fff">
        <ellipse cx="22" cy="25" rx="16" ry="9"/><ellipse cx="42" cy="17" rx="18" ry="12"/><ellipse cx="62" cy="25" rx="14" ry="8"/>
      </svg>
      <svg class="cloud cloud-3" viewBox="0 0 80 36" fill="#fff">
        <ellipse cx="22" cy="25" rx="16" ry="9"/><ellipse cx="42" cy="17" rx="18" ry="12"/><ellipse cx="62" cy="25" rx="14" ry="8"/>
      </svg>
      <!-- 半沉落日 + 剪影飞鸟（傍晚） -->
      <div class="dusk-sun"></div>
      <svg class="bird bird-1" viewBox="0 0 32 12" fill="none" stroke-linecap="round">
        <path d="M2 10 Q9 2 16 10 Q23 2 30 10"/>
      </svg>
      <svg class="bird bird-2" viewBox="0 0 32 12" fill="none" stroke-linecap="round">
        <path d="M2 10 Q9 2 16 10 Q23 2 30 10"/>
      </svg>
      <!-- 底部双层海浪 -->
      <svg class="wave wave-back" viewBox="0 0 2880 190" preserveAspectRatio="none">
        <path d="M0,110 C240,60 480,160 720,110 C960,60 1200,160 1440,110 C1680,60 1920,160 2160,110 C2400,60 2640,160 2880,110 L2880,190 L0,190 Z" />
      </svg>
      <svg class="wave wave-front" viewBox="0 0 2880 190" preserveAspectRatio="none">
        <path d="M0,135 C260,90 520,180 780,135 C1040,90 1240,175 1440,135 C1700,90 1960,180 2220,135 C2480,90 2680,175 2880,135 L2880,190 L0,190 Z" />
      </svg>
    </div>

    <!-- 顶栏：品牌 + 用户胶囊 -->
    <header class="home-top">
      <div class="brand-row">
        <span class="brand-mark">OC</span>
        <span class="brand-name">OCSKILL</span>
      </div>
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

    <!-- 中央品牌区 + 入口卡片 -->
    <main class="home-hero">
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

      <div class="entry-cards">
        <div class="entry-card" @click="enterSystem">
          <div class="entry-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <div class="entry-info">
            <div class="entry-name">进入系统</div>
            <div class="entry-desc">检索故障排查记录，沉淀维修知识</div>
          </div>
          <div class="entry-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </div>
        </div>
      </div>
    </main>

    <footer class="home-footer">
      <p>&copy; 2026 OCSKILL &middot; 技术知识查询系统</p>
      <p class="record-links">
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
import { getTimeTheme, getGreeting, getGreetingIcon } from '@/utils/theme'

export default {
  name: 'MainPage',
  data() {
    return {
      username: '',
      privilege: 1,
      stars: [],
      theme: 'night'
    }
  },
  computed: {
    avatarLetter() {
      return this.username ? this.username.trim().charAt(0).toUpperCase() : '·'
    },
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
    handleUserCommand(command) {
      if (command === 'mine') {
        this.$router.push('/system/mine')
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
    },
    enterSystem() {
      this.$router.push('/system/retrieval')
    },
    generateStars() {
      // 手动布置：主要分布在四角和边缘，避开中央标题/卡片区域
      const positions = [
        { top: 8, left: 7 }, { top: 6, left: 26 }, { top: 4, left: 58 },
        { top: 9, left: 76 }, { top: 16, left: 92 }, { top: 22, left: 5 },
        { top: 28, left: 18 }, { top: 32, left: 88 }, { top: 45, left: 4 },
        { top: 50, left: 95 }, { top: 62, left: 12 }, { top: 68, left: 84 },
        { top: 78, left: 6 }, { top: 82, left: 26 }, { top: 85, left: 70 },
        { top: 88, left: 90 }, { top: 74, left: 38 }, { top: 36, left: 96 }
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
    }
  }
}
</script>

<style scoped>
.home-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--oc-hero-bg);
  overflow: hidden;
}

/* 48px 网格线装饰 */
.home-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--oc-hero-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--oc-hero-grid) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

/* ===== 背景装饰层 ===== */
.bg-decor {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* --- 声呐波纹 --- */
.sonar {
  position: absolute;
  width: 0;
  height: 0;
}

.sonar-tr {
  top: 14%;
  right: 18%;
}

.sonar-bl {
  bottom: 16%;
  left: 10%;
}

.sonar-ring {
  position: absolute;
  left: 0;
  top: 0;
  width: 220px;
  height: 220px;
  margin: -110px 0 0 -110px;
  border-radius: 50%;
  border: 1.5px solid var(--oc-hero-sonar-ring);
  opacity: 0;
  transform: scale(0.15);
  animation: sonar-pulse 6s ease-out infinite;
}

.sonar-dot {
  position: absolute;
  left: -4px;
  top: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--oc-cyan-500);
  box-shadow: 0 0 12px rgba(6, 182, 212, 0.9);
  animation: sonar-dot 3s ease-in-out infinite;
}

.sonar-bl .sonar-dot {
  background: var(--oc-blue-400);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.9);
}

@keyframes sonar-pulse {
  0% {
    opacity: 0;
    transform: scale(0.15);
  }
  12% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}

@keyframes sonar-dot {
  0%, 100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.4;
  }
}

/* --- 底部海浪 --- */
.wave {
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 200%;
  height: 180px;
}

.wave path {
  fill: var(--oc-hero-wave-back);
}

.wave-back {
  animation: wave-drift 18s linear infinite;
}

.wave-front {
  animation: wave-drift 12s linear infinite reverse;
}

.wave-front path {
  fill: var(--oc-hero-wave-front);
}

@keyframes wave-drift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.star {
  position: absolute;
  background: #fff;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  opacity: 0.55;
  animation: star-twinkle ease-in-out infinite;
  pointer-events: none;
}

.star-sm {
  width: 6px;
  height: 6px;
  box-shadow: 0 0 8px 1px rgba(255, 255, 255, 0.35);
}

.star-md {
  width: 9px;
  height: 9px;
  box-shadow: 0 0 12px 2px rgba(255, 255, 255, 0.45);
}

.star-lg {
  width: 12px;
  height: 12px;
  box-shadow: 0 0 16px 3px rgba(6, 182, 212, 0.45);
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

/* --- 流星 --- */
.meteor {
  position: absolute;
  width: 140px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6));
  transform: rotate(-35deg);
  opacity: 0;
  pointer-events: none;
}

.meteor::after {
  content: '';
  position: absolute;
  left: -2px;
  top: -2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8);
}

.meteor-1 {
  top: 12%;
  left: 68%;
  animation: meteor-fall 9s linear infinite;
  animation-delay: 2s;
}

.meteor-2 {
  top: 26%;
  left: 42%;
  width: 100px;
  animation: meteor-fall 13s linear infinite;
  animation-delay: 7s;
}

@keyframes meteor-fall {
  0% {
    opacity: 0;
    transform: rotate(-35deg) translateX(0);
  }
  2% {
    opacity: 1;
  }
  8% {
    opacity: 0;
    transform: rotate(-35deg) translateX(-380px);
  }
  100% {
    opacity: 0;
    transform: rotate(-35deg) translateX(-380px);
  }
}

/* --- 白云（清晨/白日） --- */
.cloud {
  position: absolute;
  display: none;
  opacity: 0.85;
  filter: drop-shadow(0 4px 10px rgba(148, 163, 184, 0.25));
  animation: cloud-drift linear infinite;
}

.cloud-1 { top: 9%; width: 120px; animation-duration: 75s; }
.cloud-2 { top: 20%; width: 80px; opacity: 0.65; animation-duration: 95s; animation-delay: -30s; }
.cloud-3 { top: 32%; width: 150px; opacity: 0.75; animation-duration: 110s; animation-delay: -65s; }

@keyframes cloud-drift {
  from { transform: translateX(-18vw); }
  to { transform: translateX(115vw); }
}

/* --- 半沉落日 + 剪影飞鸟（傍晚） --- */
.dusk-sun {
  position: absolute;
  display: none;
  left: 50%;
  bottom: 30px;
  width: 130px;
  height: 130px;
  margin-left: -65px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, #FDBA74, #F97316 72%);
  box-shadow: 0 0 60px 24px rgba(249, 115, 22, 0.4);
  animation: dusk-sun-breathe 5s ease-in-out infinite;
}

@keyframes dusk-sun-breathe {
  0%, 100% { box-shadow: 0 0 60px 24px rgba(249, 115, 22, 0.4); }
  50% { box-shadow: 0 0 80px 32px rgba(249, 115, 22, 0.55); }
}

.bird {
  position: absolute;
  display: none;
  stroke: rgba(30, 27, 75, 0.8);
  stroke-width: 2.2;
  opacity: 0;
  animation: bird-fly linear infinite;
}

.bird-1 { top: 16%; width: 34px; animation-duration: 26s; animation-delay: 4s; }
.bird-2 { top: 23%; width: 24px; animation-duration: 34s; animation-delay: 16s; }

@keyframes bird-fly {
  0% { transform: translate(-8vw, 0); opacity: 0; }
  2% { opacity: 0.85; }
  36% { opacity: 0.85; }
  40% { transform: translate(108vw, -26px); opacity: 0; }
  100% { transform: translate(108vw, -26px); opacity: 0; }
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
  width: 26px;
  height: 26px;
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
  50% { filter: drop-shadow(0 0 8px rgba(251, 146, 60, 0.75)); }
}

.icon-moon {
  animation: moon-glow 4s ease-in-out infinite;
}

@keyframes moon-glow {
  0%, 100% { filter: drop-shadow(0 0 2px rgba(253, 230, 138, 0.35)); }
  50% { filter: drop-shadow(0 0 8px rgba(253, 230, 138, 0.7)); }
}

/* 尊重系统减弱动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .sonar-ring,
  .sonar-dot,
  .wave,
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

/* 顶栏 */
.home-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
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
  color: var(--oc-hero-text);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
}

/* 用户胶囊（深色背景版） */
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
  background: var(--oc-hero-capsule-hover);
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
  color: var(--oc-hero-text);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capsule-arrow {
  font-size: 12px;
  color: var(--oc-hero-text-secondary);
}

/* 中央品牌区 */
.home-hero {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.hero-greeting {
  margin: 0 0 12px;
  color: var(--oc-hero-text);
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.hero-title {
  margin: 0;
  color: var(--oc-hero-text);
  font-size: 40px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 1px;
}

.hero-subtitle {
  margin: 14px 0 0;
  color: var(--oc-hero-text-secondary);
  font-size: 16px;
}

/* 入口卡片 */
.entry-cards {
  margin-top: 48px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.entry-card {
  width: 320px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  box-shadow: var(--oc-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
}

.entry-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--oc-shadow-hover);
}

.entry-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--oc-blue-50);
  color: var(--oc-blue-600);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.entry-icon svg {
  width: 24px;
  height: 24px;
}

.entry-info {
  flex: 1;
  min-width: 0;
}

.entry-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--oc-gray-900);
}

.entry-desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--oc-gray-400);
}

.entry-arrow {
  color: var(--oc-gray-300);
  flex-shrink: 0;
  transition: color 0.2s ease, transform 0.2s ease;
}

.entry-card:hover .entry-arrow {
  color: var(--oc-blue-600);
  transform: translateX(4px);
}

.entry-arrow svg {
  width: 20px;
  height: 20px;
}

/* 页脚 */
.home-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 16px 0;
  font-size: 12px;
  color: var(--oc-hero-text-muted);
  line-height: 1.8;
}

.home-footer p {
  margin: 0;
}

.record-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.home-footer a {
  color: var(--oc-hero-text-muted);
  text-decoration: none;
}

.home-footer a:hover {
  color: var(--oc-hero-text);
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
