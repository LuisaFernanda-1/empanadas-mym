import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import PublicLayout from './layouts/PublicLayout.jsx'
import HomeView from './views/HomeView.jsx'
import { store } from './store/site.js'
import { checkSession } from './store/auth.js'
import { isDemo } from './config.js'

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', component: HomeView, meta: { title: null } },
      { path: 'quienes-somos', component: () => import('./views/AboutView.jsx'), meta: { title: 'Quiénes somos' } },
      { path: 'productos', component: () => import('./views/ProductsView.jsx'), meta: { title: 'products' } },
      { path: 'productos/:id(\\d+)', component: () => import('./views/ProductDetailView.jsx') },
      { path: 'galeria', component: () => import('./views/GalleryView.jsx'), meta: { title: 'Galería' } },
      { path: 'contacto', component: () => import('./views/ContactView.jsx'), meta: { title: 'Contacto' } },
      { path: ':pathMatch(.*)*', component: () => import('./views/NotFoundView.jsx'), meta: { title: 'Página no encontrada' } },
    ],
  },
  { path: '/admin', component: () => import('./admin/AdminLogin.jsx'), meta: { title: 'Ingresar', guest: true } },
  { path: '/admin/olvide-contrasena', component: () => import('./admin/AdminForgot.jsx'), meta: { title: 'Recuperar contraseña', guest: true } },
  { path: '/admin/nueva-contrasena', component: () => import('./admin/AdminReset.jsx'), meta: { title: 'Nueva contraseña', guest: true } },
  {
    path: '/admin',
    component: () => import('./admin/AdminLayout.jsx'),
    meta: { auth: true },
    children: [{ path: 'productos', component: () => import('./admin/AdminProducts.jsx'), meta: { title: 'Panel · Productos' } }],
  },
]

const router = createRouter({
  // La vista previa (un solo archivo) usa #/ ; en Hostinger, URLs limpias
  history: isDemo ? createWebHashHistory() : createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || (to.hash ? { el: to.hash } : { top: 0 }),
})

router.beforeEach(async (to) => {
  if (to.matched.some((r) => r.meta.auth)) {
    const user = await checkSession()
    if (!user) return { path: '/admin', query: { next: to.fullPath } }
  }
  if (to.meta.guest && (await checkSession())) return '/admin/productos'
})

router.afterEach((to) => {
  if (!store.site) return
  let title = to.meta.title
  if (title === 'products') title = store.site.productsLabel
  if (title === undefined) return // el detalle de producto pone su propio título
  document.title = title ? `${title} | ${store.site.name}` : `${store.site.name} | ${store.site.heroTitle}`
})

export default router
