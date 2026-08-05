<template>
  <div class="user-management-page">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <p class="page-subtitle">管理系统注册用户</p>
    </div>

    <div class="content-card">
      <!-- 工具条：搜索 + 新增 -->
      <div class="toolbar">
        <el-input
          v-model="searchForm.username"
          placeholder="请输入用户名"
          clearable
          class="search-input"
          :prefix-icon="Search"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" class="add-btn" :icon="Plus" @click="openAddDialog">新增用户</el-button>
      </div>

      <!-- 用户表格 -->
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column label="用户名" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-avatar" :style="{ background: avatarColor(row.username) }">
                {{ (row.username || '?').charAt(0).toUpperCase() }}
              </span>
              <span class="user-name">{{ row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="使用者" min-width="140" align="center" />
        <el-table-column label="创建时间" min-width="180" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ row.createTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="权限" min-width="140" align="center">
          <template #default="{ row }">
            <span class="priv-tag" :class="privilegeTagClass(row.privilege)">{{ privilegeText(row.privilege) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <button class="table-action-btn action-primary" @click="openPasswordDialog(row)">修改密码</button>
            <button class="table-action-btn action-danger" @click="handleDelete(row)">删除</button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty">
            <div class="table-empty-illustration">
              <svg viewBox="0 0 120 120" fill="none">
                <rect x="28" y="20" width="48" height="60" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2.5"/>
                <line x1="38" y1="34" x2="66" y2="34" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="38" y1="44" x2="66" y2="44" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="38" y1="54" x2="56" y2="54" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="72" cy="66" r="16" fill="#fff" stroke="#93C5FD" stroke-width="3"/>
                <line x1="83" y1="77" x2="94" y2="88" stroke="#93C5FD" stroke-width="3.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="table-empty-title">未找到匹配用户</p>
            <p class="table-empty-sub">换个用户名关键词试试</p>
          </div>
        </template>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 新增用户弹窗（label 置顶规范） -->
    <el-dialog v-model="addDialogVisible" title="新增用户" width="480px" :close-on-click-modal="false">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="addForm.password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="权限" prop="privilege">
          <el-select v-model="addForm.privilege" placeholder="请选择权限" style="width: 100%">
            <el-option :value="1" label="仅查询" />
            <el-option :value="2" label="查询与上传" />
            <el-option :value="3" label="所有权限" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddUser">提交</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗（label 置顶规范） -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px" :close-on-click-modal="false">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-position="top">
        <el-form-item label="密码" prop="password">
          <el-input v-model="passwordForm.password" type="password" placeholder="请输入当前密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassword">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 头像色板（按用户名 hash 取色）
const AVATAR_PALETTE = ['#2563EB', '#06B6D4', '#8B5CF6', '#F59E0B', '#10B981', '#F97316']

export default {
  name: 'UserManagementPage',
  data() {
    return {
      loading: false,
      searchForm: {
        username: ''
      },
      pagination: {
        currentPage: 1,
        pageSize: 5
      },
      total: 0,
      tableData: [],
      addDialogVisible: false,
      addForm: {
        username: '',
        password: '',
        name: '',
        privilege: 1
      },
      addRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { max: 10, message: '用户名不能超过10个字符', trigger: 'blur' }
        ],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }
          ,{ max: 10, message: '密码长度必须小于等于10个字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
          { max: 10, message: '姓名不能超过10个字符', trigger: 'blur' }
        ],
        privilege: [{ required: true, message: '请选择权限', trigger: 'change' }]
      },
      passwordDialogVisible: false,
      passwordForm: {
        id: null,
        username: '',
        password: '',
        newPassword: ''
      },
      passwordRules: {
        password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { validator: this.validateNewPassword, trigger: 'blur' }
        ]
      },
      Search: markRaw(Search),
      Plus: markRaw(Plus)
    }
  },
  created() {
    this.fetchUsers()
  },
  methods: {
    privilegeText(value) {
      const map = { 1: '仅查询', 2: '查询与上传', 3: '所有权限' }
      return map[value] || '未知'
    },
    privilegeTagClass(value) {
      const map = { 1: 'priv-normal', 2: 'priv-advanced', 3: 'priv-admin' }
      return map[value] || 'priv-normal'
    },
    avatarColor(username) {
      const name = String(username || '')
      let hash = 0
      for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0
      }
      return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
    },
    async fetchUsers() {
      this.loading = true
      try {
        const res = await request.get('/users', {
          params: {
            username: this.searchForm.username.trim(),
            page: this.pagination.currentPage,
            pageSize: this.pagination.pageSize
          }
        })
        if (res.data.code === 1) {
          const { total, rows } = res.data.data || {}
          this.total = total || 0
          this.tableData = (rows || []).map(item => ({
            ...item,
            createTime: this.formatDateTime(item.createTime)
          }))
        } else {
          ElMessage.error(res.data.msg || '获取用户列表失败')
        }
      } catch (err) {
        console.error('获取用户列表失败:', err)
        ElMessage.error('获取用户列表失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.currentPage = 1
      this.fetchUsers()
    },
    handleCurrentChange(page) {
      this.pagination.currentPage = page
      this.fetchUsers()
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.fetchUsers()
    },
    openAddDialog() {
      this.addForm = { username: '', password: '', name: '', privilege: 1 }
      this.addDialogVisible = true
      this.$nextTick(() => {
        this.$refs.addFormRef && this.$refs.addFormRef.clearValidate()
      })
    },
    submitAddUser() {
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) return
        try {
          const res = await request.post('/users', this.addForm)
          if (res.data.code === 1) {
            ElMessage.success('新增用户成功')
            this.addDialogVisible = false
            this.fetchUsers()
          } else {
            ElMessage.error(res.data.msg || '新增用户失败')
          }
        } catch (err) {
          console.error('新增用户失败:', err)
          ElMessage.error('新增用户失败')
        }
      })
    },
    openPasswordDialog(row) {
      this.passwordForm = { id: row.id, username: row.username, password: '', newPassword: '' }
      this.passwordDialogVisible = true
      this.$nextTick(() => {
        this.$refs.passwordFormRef && this.$refs.passwordFormRef.clearValidate()
      })
    },
    validateNewPassword(rule, value, callback) {
      if (value === this.passwordForm.password) {
        callback(new Error('新密码不能与当前密码相同'))
      } else {
        callback()
      }
    },
    submitPassword() {
      this.$refs.passwordFormRef.validate(async valid => {
        if (!valid) return
        try {
          const res = await request.put('/users', {
            username: this.passwordForm.username,
            password: this.passwordForm.password,
            newPassword: this.passwordForm.newPassword
          })
          if (res.data.code === 1) {
            ElMessage.success('密码修改成功')
            this.passwordDialogVisible = false
          } else {
            ElMessage.error(res.data.msg || '密码修改失败')
          }
        } catch (err) {
          console.error('密码修改失败:', err)
          ElMessage.error('密码修改失败')
        }
      })
    },
    handleDelete(row) {
      ElMessageBox.confirm(`确定删除用户 ${row.username} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        request.delete('/users', { params: { id: row.id } }).then(res => {
          if (res.data.code === 1) {
            ElMessage.success('删除成功')
            this.fetchUsers()
          } else {
            ElMessage.error(res.data.msg || '删除失败')
          }
        }).catch(() => {
          ElMessage.error('删除失败')
        })
      }).catch(() => {})
    },
    formatDateTime(value) {
      if (!value) return ''
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const h = String(date.getHours()).padStart(2, '0')
      const mi = String(date.getMinutes()).padStart(2, '0')
      const s = String(date.getSeconds()).padStart(2, '0')
      return `${y}-${m}-${d} ${h}:${mi}:${s}`
    }
  }
}
</script>

<style scoped>
.user-management-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: var(--oc-text-2xl);
  font-weight: 600;
  color: var(--oc-gray-900);
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-400);
}

.content-card {
  background: var(--oc-bg-white);
  border: var(--oc-card-border);
  border-radius: var(--oc-radius-md);
  padding: 16px 20px 20px;
  box-shadow: var(--oc-shadow-sm);
}

/* 工具条 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-input {
  width: 260px;
}

/* 用户名列：首字母头像 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: var(--oc-text-md);
  color: var(--oc-gray-900);
  font-weight: 500;
}

/* 创建时间：13px 次要文字 + 等宽数字 */
.time-text {
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-500);
  font-feature-settings: "tnum";
}

/* 权限标签：柔和风（1 灰 / 2 蓝 / 3 琥珀金） */
.priv-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--oc-radius-sm);
  font-size: var(--oc-text-xs);
  font-weight: 500;
}

.priv-tag.priv-normal {
  background: var(--oc-info-bg);
  color: var(--oc-gray-500);
}

.priv-tag.priv-advanced {
  background: var(--oc-blue-50);
  color: var(--oc-blue-700);
}

.priv-tag.priv-admin {
  background: var(--oc-warning-bg);
  color: #B45309;
}

/* 操作列文字按钮 */
.table-action-btn {
  padding: 4px 6px;
  font-size: var(--oc-text-sm);
  background: none;
  border: none;
  border-radius: var(--oc-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-primary {
  color: var(--oc-blue-600);
}

.action-primary:hover {
  background: var(--oc-blue-50);
}

.action-danger {
  color: var(--oc-danger);
}

.action-danger:hover {
  background: var(--oc-danger-bg);
}

/* 表格空状态 */
.table-empty {
  padding: 36px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.table-empty-illustration {
  width: 96px;
  height: 96px;
  margin-bottom: 12px;
}

.table-empty-illustration svg {
  width: 100%;
  height: 100%;
}

.table-empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--oc-gray-700);
}

.table-empty-sub {
  margin: 6px 0 0;
  font-size: var(--oc-text-sm);
  color: var(--oc-gray-400);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
