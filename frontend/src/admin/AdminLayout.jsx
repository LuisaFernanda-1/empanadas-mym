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
    return () => {
      const s = store.site
      const user = auth.user?.username || ''
      const links = [
        { to: '/admin/productos', icon: 'package', label: s.productsLabel },
        { to: '/admin/imagenes', icon: 'image', label: 'Imágenes del sitio' },
      ]
      return (
        <div class="admin">
          <aside class="admin__side">
            <div class="admin__brand">
              <span class="admin__logo">{s.logo ? <img src={s.logo} alt="" /> : s.name.charAt(0)}</span>
              <div class="admin__brand-text">
                <strong>{s.name}</strong>
                <small>Panel administrativo</small>
              </div>
            </div>

            <p class="admin__label">Menú</p>
            <nav class="admin__nav">
              {links.map((l) => (
                <RouterLink key={l.to} to={l.to} class="admin__link" activeClass="is-active" title={l.label}>
                  <span class="admin__icon"><Icon name={l.icon} size={18} /></span>
                  <span class="admin__text">{l.label}</span>
                </RouterLink>
              ))}
              <RouterLink to="/" class="admin__link admin__link--visit" target={isDemo ? undefined : '_blank'} title="Ver mi sitio">
                <span class="admin__icon"><Icon name="external" size={18} /></span>
                <span class="admin__text">Ver mi sitio</span>
              </RouterLink>
            </nav>

            <div class="admin__user">
              <span class="admin__avatar">{user.charAt(0).toUpperCase()}</span>
              <div class="admin__user-text">
                <strong>{user}</strong>
                <small>Administrador</small>
              </div>
              <button class="admin__logout" onClick={out} title="Cerrar sesión" aria-label="Cerrar sesión"><Icon name="logout" size={18} /></button>
            </div>
          </aside>
          <main class="admin__main">
            {isDemo && <div class="demo-banner">Modo demostración: los cambios se guardan solo mientras la página esté abierta.</div>}
            <RouterView />
          </main>
        </div>
      )
    }
  },
})
