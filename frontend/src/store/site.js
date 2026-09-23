// Estado global del emprendimiento visitado (información + productos)
import { reactive } from 'vue'
import { api } from '@backend'

export const store = reactive({
  site: null,
  features: [],
  gallery: [],
  socials: [],
  products: [],
  productsLoaded: false,
  error: null,
})

export async function loadSite() {
  try {
    // index.php ya inyecta los datos en window.__SITE__ (carga instantánea y SEO);
    // si no están (desarrollo con Vite), se piden a la API.
    const data = window.__SITE__ ?? (await api.site())
    Object.assign(store, data)
    applyTheme(data.site.theme)
  } catch (e) {
    store.error = e.message
  }
}

export async function loadProducts(force = false) {
  if (store.productsLoaded && !force) return store.products
  store.products = await api.products()
  store.productsLoaded = true
  return store.products
}

/** Aplica colores y fuentes del emprendimiento como variables CSS */
export function applyTheme(theme) {
  if (!theme) return
  const root = document.documentElement.style
  root.setProperty('--c-primary', theme.primary)
  root.setProperty('--c-secondary', theme.secondary)
  root.setProperty('--c-accent', theme.accent)
  root.setProperty('--f-heading', `"${theme.fontHeading}"`)
  root.setProperty('--f-brand', `"${theme.fontBrand}"`)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.primary)

  // En producción index.php ya incluye las fuentes; aquí solo si faltan
  if (!document.querySelector('link[data-fonts], link[href*="fonts.googleapis.com/css2"]')) {
    const families = [...new Set([theme.fontHeading, theme.fontBrand, 'Inter'])]
      .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
      .join('&')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.dataset.fonts = ''
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
  }
}
