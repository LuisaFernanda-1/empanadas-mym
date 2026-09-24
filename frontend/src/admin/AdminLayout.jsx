// Estructura del panel: barra lateral (Productos · Imágenes del sitio · Ver sitio · Cerrar sesión)
import { defineComponent } from 'vue'
import { RouterView, RouterLink, useRouter } from 'vue-router'
import Icon from '@/components/Icon.jsx'
import { store } from '@/store/site.js'
import { auth, logout } from '@/store/auth.js'
import { isDemo } from '@/config.js'

export default defineComponent({
  name: 'AdminLayout',
  setup() {
    const router = useRouter()
    async function out() {
      await logout()
      router.replace('/admin')
    }
    return () => (
      <div class="admin">
        <aside class="admin__side">
          <div class="admin__brand">
            {store.site.logo && <img src={store.site.logo} alt="" />}
            <span>{store.site.name}</span>
          </div>
          <nav class="admin__nav">
            <RouterLink to="/admin/productos" class="admin__link" activeClass="is-active"><Icon name="package" size={19} /> <span>{store.site.productsLabel}</span></RouterLink>
            <RouterLink to="/admin/imagenes" class="admin__link" activeClass="is-active"><Icon name="image" size={19} /> <span>Imágenes del sitio</span></RouterLink>
            <RouterLink to="/" class="admin__link" target={isDemo ? undefined : '_blank'}><Icon name="external" size={19} /> <span>Ver mi sitio</span></RouterLink>
            <button class="admin__link" onClick={out}><Icon name="logout" size={19} /> <span>Cerrar sesión</span></button>
          </nav>
          <div class="admin__user"><Icon name="user" size={16} /> {auth.user?.username}</div>
        </aside>
        <main class="admin__main">
          {isDemo && <div class="demo-banner">Modo demostración: los cambios se guardan solo mientras la página esté abierta.</div>}
          <RouterView />
        </main>
      </div>
    )
  },
})
