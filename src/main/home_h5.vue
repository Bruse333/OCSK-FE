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
      <img src="../assets/ocskill_h5.png" alt="Display Image" />
      <div class="action-bar">
          <button class="btn-primary" @click="openModal" v-if="privilege === 3">新增用户</button>
          <button class="btn-primary btn-enter-system" @click="enterSystem">进入系统</button>
        </div>
    </div>
    <footer class="footer-record">
      <p>Copyright © 2026 OCSKILL技术知识查询.</p>
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

    <!-- 模态框遮罩 -->
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
      }
    }
  },
  created() {
    this.username = getUsername() || ''
    this.privilege = getPrivilege()

    ElNotification({
    title: '手机用户',
    message: '请前往微信小程序获取更佳体验！',
    type: 'primary',
    position: 'top-left',
    showClose: false,
    offset: 60,
    duration: 2000
  })
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
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-header {
  background: #f0f5ff;
  padding: 10px 16px;
  border-bottom: 1px solid #d0dff0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.site-name {
  margin: 0;
  color: #1a3a6e;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
}

.header-right {
  position: absolute;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-username {
  color: #1a3a6e;
  font-size: 13px;
  font-weight: 500;
}

.btn-logout {
  padding: 5px 10px;
  font-size: 12px;
  color: #1a5fb4;
  background: #fff;
  border: 1px solid #3584e4;
  border-radius: 4px;
  cursor: pointer;
}

.btn-logout:active {
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
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.btn-primary {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(26, 95, 180, 0.3);
  white-space: nowrap;
}

.btn-primary:active {
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

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 30, 60, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-dialog {
  background: #fff;
  border-radius: 10px;
  width: 92vw;
  box-shadow: 0 8px 32px rgba(26, 58, 110, 0.25);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  color: #fff;
}

.modal-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 26px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  opacity: 0.8;
}

.modal-close:active {
  opacity: 1;
}

.modal-dialog form {
  padding: 16px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #1a3a6e;
  font-weight: 500;
}

.required {
  color: #e04040;
}

.form-group input,
.form-group select {
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

.form-group input:focus,
.form-group select:focus {
  border-color: #3584e4;
  box-shadow: 0 0 0 2px rgba(53, 132, 228, 0.2);
}

.form-group input::placeholder {
  color: #a0b8d8;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  padding: 10px 28px;
  font-size: 15px;
  color: #1a5fb4;
  background: #fff;
  border: 1px solid #3584e4;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel:active {
  background: #f0f5ff;
}

.btn-submit {
  padding: 10px 28px;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(26, 95, 180, 0.3);
}

.btn-submit:active {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
}

/* 提示弹框 */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 30, 60, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.alert-dialog {
  background: #fff;
  border-radius: 10px;
  width: 80vw;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(26, 58, 110, 0.25);
  overflow: hidden;
}

.alert-msg {
  margin: 0;
  padding: 28px 20px;
  font-size: 15px;
  color: #1a3a6e;
  text-align: center;
  line-height: 1.6;
}

.alert-btn {
  display: block;
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  color: #fff;
  background: linear-gradient(135deg, #3584e4, #1a5fb4);
  border: none;
  cursor: pointer;
}

.alert-btn:active {
  background: linear-gradient(135deg, #1a5fb4, #14478a);
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
