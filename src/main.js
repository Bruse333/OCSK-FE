import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import './assets/main.css'
import './assets/theme.css'

const app = createApp(App)

app.use(router)
app.use(ElementPlus)

// 全局注册 element-plus 图标组件，template 中可直接 <el-icon><Search/></el-icon>
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
