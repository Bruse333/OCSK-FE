<template>
  <div class="user-management-page">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <p class="page-subtitle">管理系统注册用户</p>
    </div>

    <div class="content-card">
      <!-- 工具栏：搜索 + 新增 -->
      <div class="toolbar">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="用户名">
            <el-input
              v-model="searchForm.username"
              placeholder="请输入用户名"
              clearable
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="openAddDialog">+ 新增用户</el-button>
      </div>

      <!-- 用户表格 -->
      <el-table :data="tableData" border v-loading="loading" style="width: 100%">
        <el-table-column prop="username" label="用户名" min-width="140" align="center" />
        <el-table-column prop="name" label="使用者" min-width="140" align="center" />
        <el-table-column prop="createTime" label="创建时间" min-width="180" align="center" />
        <el-table-column prop="createTime" label="创建时间" min-width="180" align="center" />
        <el-table-column label="权限" min-width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="privilegeTagType(row.privilege)">{{ privilegeText(row.privilege) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="openPasswordDialog(row)">修改密码</el-button>
            <el-button size="small" type="danger" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
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

    <!-- 新增用户弹窗 -->
    <el-dialog v-model="addDialogVisible" title="新增用户" width="480px" :close-on-click-modal="false">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="80px">
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

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px" :close-on-click-modal="false">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

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
      }
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
    privilegeTagType(value) {
      const map = { 1: 'info', 2: 'success', 3: 'danger' }
      return map[value] || 'info'
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
        // 后端接口完成后替换为真实请求
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
        this.fetchUsers()
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
  font-size: 20px;
  font-weight: 600;
  color: #1a3a6e;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #999;
}

.content-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
