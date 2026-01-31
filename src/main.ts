import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 使用Pinia
app.use(createPinia())

// 使用路由
app.use(router)

app.mount('#app')