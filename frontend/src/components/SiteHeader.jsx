// Encabezado con menú adaptable (hamburguesa en celular) y botón de WhatsApp
import { defineComponent, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Brand from './Brand.jsx'
import Icon from './Icon.jsx'
import { store } from '@/store/site.js'
import { whatsappLink } from '@/utils/format.js'

export const navLinks = () => [
  { to: '/', label: 'Inicio' },
  { to: '/quienes-somos', label: 'Quiénes somos' },
  { to: '/productos', label: store.site?.productsLabel || 'Productos' },
  { to: '/galeria', label: 'Galería' },
  { to: '/contacto', label: 'Contacto' },
]

export default defineComponent({
  name: 'SiteHeader',
  setup() {
    const open = ref(false)
    const scrolled = ref(false)
    const route = useRoute()
    watch(() => route.fullPath, () => (open.value = false))
    watch(open, (v) => document.body.classList.toggle('no-scroll', v))
    const onScroll = () => (scrolled.value = window.scrollY > 8)
    onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
    onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

    const isActive = (to) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

    return () => {
      const c = store.site.contact
      const wa = whatsappLink(c.whatsapp, c.whatsappMessage)
      return (
        <header class={['header', { 'header--scrolled': scrolled.value }]}>
          <div class="container header__inner">
            <Brand />
            <nav class={['nav', { 'nav--open': open.value }]} aria-label="Principal">
              <ul class="nav__list">
                {navLinks().map((l) => (
                  <li key={l.to}>
                    <RouterLink to={l.to} class={['nav__link', { 'is-active': isActive(l.to) }]}>{l.label}</RouterLink>
                  </li>
                ))}
              </ul>
              <RouterLink to="/admin" class="btn btn--outline btn--sm nav__wa-mobile">
                <Icon name="lock" size={16} /> Administrar productos
              </RouterLink>
              <a href={wa} target="_blank" rel="noopener" class="btn btn--primary btn--sm nav__wa-mobile">
                <Icon name="whatsapp" size={18} /> Escríbenos por WhatsApp
              </a>
            </nav>
            <div class="header__actions">
              <RouterLink to="/admin" class="btn btn--outline btn--sm header__admin" title="Administrar productos" aria-label="Administrar productos">
                <Icon name="lock" size={16} /> <span class="header__admin-label">Administrar</span>
              </RouterLink>
              <a href={wa} target="_blank" rel="noopener" class="btn btn--primary btn--sm header__wa" aria-label="Escríbenos por WhatsApp">
                <Icon name="whatsapp" size={18} /> <span class="header__wa-label">WhatsApp</span>
              </a>
              <button class="header__toggle" aria-label={open.value ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open.value} onClick={() => (open.value = !open.value)}>
                <Icon name={open.value ? 'x' : 'menu'} size={24} />
              </button>
            </div>
          </div>
        </header>
      )
    }
  },
})
