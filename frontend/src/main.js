import { createApp } from 'vue'
import App from './App.jsx'
import router from './router.js'
import { loadSite } from './store/site.js'
import './styles/main.css'
import './styles/admin.css'

// 1) Datos del emprendimiento (según el dominio)  2) Monta la app
loadSite().then(() => {
  createApp(App).use(router).mount('#app')
})
