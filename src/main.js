import { createSSRApp } from 'vue'
import App from './App.vue'
import FlowDB from './common/db.js'

// UniApp 全局属性（模块级初始化）
uni.$flipDirection = null
uni.$pageOrder = ['home', 'todos', 'stats', 'breathe']

export function createApp() {
  const app = createSSRApp(App)

  // 创建全局单例数据库实例
  const db = new FlowDB()
  uni.$db = db
  app.config.globalProperties.$db = db

  return { app }
}
