import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/styles/main.css'

// Import all tool modules for their registerTool() side effects
import './tools/index'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
