import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '../main/home.vue'
import MainPageH5 from '../main/home_h5.vue'
import LoginPage from '../login/login.vue'
import LoginPageH5 from '../login/login_h5.vue'
import SystemLayout from '../system/SystemLayout.vue'
import SystemLayoutH5 from '../system/SystemLayoutH5.vue'
import RetrievalPage from '../system/Retrieval.vue'
import RetrievalPageH5 from '../system/RetrievalH5.vue'
import AddRecordPage from '../system/AddRecord.vue'
import AddRecordPageH5 from '../system/AddRecordH5.vue'
import MinePage from '../system/Mine.vue'
import MinePageH5 from '../system/MineH5.vue'
import BatchUploadPage from '../system/BatchUpload.vue'
import DataStatisticsPage from '../system/DataStatistics.vue'
import UserManagementPage from '../system/UserManagement.vue'
import FlowBuilderPage from '../system/FlowBuilder.vue'
import { getToken, getPrivilege } from '@/utils/token'

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const component = isMobile() ? MainPageH5 : MainPage
const loginComponent = isMobile() ? LoginPageH5 : LoginPage
const systemLayout = isMobile() ? SystemLayoutH5 : SystemLayout
const retrievalComponent = isMobile() ? RetrievalPageH5 : RetrievalPage
const addRecordComponent = isMobile() ? AddRecordPageH5 : AddRecordPage
const mineComponent = isMobile() ? MinePageH5 : MinePage

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'MainPage',
      component
    },
    {
      path: '/login',
      name: 'LoginPage',
      component: loginComponent
    },
    {
      path: '/system',
      component: systemLayout,
      redirect: '/system/retrieval',
      children: [
        {
          path: 'retrieval',
          name: 'RetrievalPage',
          component: retrievalComponent
        },
        {
          path: 'add',
          name: 'AddRecordPage',
          component: addRecordComponent
        },
        {
          path: 'mine',
          name: 'MinePage',
          component: mineComponent
        },
        {
          path: 'batch-upload',
          name: 'BatchUploadPage',
          component: BatchUploadPage
        },
        {
          path: 'statistics',
          name: 'DataStatisticsPage',
          component: DataStatisticsPage
        },
        {
          path: 'users',
          name: 'UserManagementPage',
          component: UserManagementPage
        },
        {
          path: 'flow-builder',
          name: 'FlowBuilderPage',
          component: FlowBuilderPage
        }
      ]
    },
  ]
})

// 路由守卫：未登录时跳转登录页；无权限访问系统管理统计页时跳转检索页
router.beforeEach((to, from, next) => {
  if (to.path !== '/login' && !getToken()) {
    next('/login')
  } else if ((to.path === '/system/statistics' || to.path === '/system/users' || to.path === '/system/batch-upload') && getPrivilege() !== 3) {
    next('/system/retrieval')
  } else if (to.path === '/system/flow-builder' && getPrivilege() < 2) {
    next('/system/retrieval')
  } else {
    next()
  }
})

export default router
