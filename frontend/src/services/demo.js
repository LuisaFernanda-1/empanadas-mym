// =====================================================================
//  API DE DEMOSTRACIÓN (solo para "npm run build:demo")
//  Simula el backend PHP en memoria usando la ficha de este emprendimiento,
//  para poder mostrar la plantilla sin servidor (GitHub Pages). Los cambios
//  del panel se pierden al recargar. En producción se usa http.js.
//  La demo es pública: se importan solo las partes de la ficha que se
//  muestran (nunca "administrador") y el acceso usa DEMO_USER / DEMO_PASS.
// =====================================================================
import { ApiError } from './errors.js'
import { DEMO_USER, DEMO_PASS } from '@/config.js'
import {
  slug, nombre, logo, mostrar_nombre_junto_al_logo, colores, fuentes, inicio, quienes_somos,
  etiqueta_productos, productos, galeria, contacto, redes, seo_descripcion,
} from '../../../sitios/empanadas-mym/ficha.json'

const ficha = {
  slug, nombre, logo, mostrar_nombre_junto_al_logo, colores, fuentes, inicio, quienes_somos,
  etiqueta_productos, productos, galeria, contacto, redes, seo_descripcion,
}

export { ApiError }
export const setCsrf = () => {}

// Solo las imágenes que la ficha usa (no toda la carpeta)
const used = new Set([
  logo, inicio.imagen_principal, quienes_somos.imagen,
  ...productos.map((p) => p.imagen), ...galeria.map((g) => g.imagen),
].filter(Boolean))
const files = Object.fromEntries(
  Object.entries(import.meta.glob('../../../sitios/empanadas-mym/imagenes/*', { eager: true, query: '?url', import: 'default' }))
    .filter(([k]) => used.has(k.split('/').pop())),
)
const img = (name) => (name ? Object.entries(files).find(([k]) => k.endsWith('/' + name))?.[1] ?? null : null)

const siteData = {
  site: {
    slug: ficha.slug,
    name: ficha.nombre,
    logo: img(ficha.logo),
    showNameInLogo: ficha.mostrar_nombre_junto_al_logo,
    tagline: ficha.inicio.antetitulo,
    heroTitle: ficha.inicio.titulo,
    heroText: ficha.inicio.descripcion,
    heroImage: img(ficha.inicio.imagen_principal),
    productsLabel: ficha.etiqueta_productos,
    metaDescription: ficha.seo_descripcion,
    about: {
      title: ficha.quienes_somos.titulo,
      paragraphs: ficha.quienes_somos.texto.split(/\n\s*\n/),
      image: img(ficha.quienes_somos.imagen),
      mission: ficha.quienes_somos.mision,
      vision: ficha.quienes_somos.vision,
    },
    contact: {
      whatsapp: ficha.contacto.whatsapp,
      whatsappMessage: ficha.contacto.mensaje_whatsapp,
      email: ficha.contacto.correo,
      phone: ficha.contacto.telefono,
      address: ficha.contacto.direccion,
      city: ficha.contacto.ciudad,
      schedule: ficha.contacto.horario,
      mapUrl: ficha.contacto.mapa_url,
    },
    theme: {
      primary: ficha.colores.principal,
      secondary: ficha.colores.secundario,
      accent: ficha.colores.fondo_suave,
      fontHeading: ficha.fuentes.titulos,
      fontBrand: ficha.fuentes.marca,
    },
  },
  features: ficha.inicio.beneficios.map((b) => ({ icon: b.icono, title: b.titulo, subtitle: b.subtitulo })),
  gallery: ficha.galeria.map((g) => ({ image: img(g.imagen), caption: g.descripcion })),
  socials: ficha.redes.map((r) => ({ network: r.red, url: r.url })),
}

let nextId = 1
let products = ficha.productos.map((p) => ({
  id: nextId++,
  name: p.nombre,
  price: p.precio ?? null,
  description: p.descripcion,
  image: img(p.imagen),
  isActive: true,
}))

let session = null
const MAX = 10
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms))
const pub = ({ isActive, ...p }) => p
const needAuth = () => {
  if (!session) throw new ApiError('Debes iniciar sesión.', 401)
}

function readForm(form, isNew) {
  const name = String(form.get('name') || '').trim()
  const description = String(form.get('description') || '').trim()
  const priceRaw = String(form.get('price') || '').replace(/[$\s.]/g, '').replace(',', '.')
  if (!name) throw new ApiError('El nombre es obligatorio (máximo 120 caracteres).', 422, 'name')
  if (description.length > 300) throw new ApiError('La descripción corta admite máximo 300 caracteres.', 422, 'description')
  if (priceRaw && (isNaN(priceRaw) || Number(priceRaw) < 0)) throw new ApiError('El precio debe ser un número válido.', 422, 'price')
  const file = form.get('image')
  const hasFile = file && typeof file === 'object' && file.size > 0
  if (isNew && !hasFile) throw new ApiError('La imagen del producto es obligatoria.', 422, 'image')
  if (hasFile) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new ApiError('Formato no permitido. Usa JPG, PNG o WEBP.', 422, 'image')
    if (file.size > 2 * 1024 * 1024) throw new ApiError('La imagen supera el tamaño permitido (2 MB).', 422, 'image')
  }
  return {
    name,
    description: description || null,
    price: priceRaw ? Math.round(Number(priceRaw)) : null,
    isActive: ['1', 'true', 'on'].includes(String(form.get('is_active') ?? '1')),
    image: hasFile ? URL.createObjectURL(file) : undefined,
  }
}

export const api = {
  async site() { return structuredClone(siteData) },
  async products() { await wait(120); return products.filter((p) => p.isActive).map(pub) },
  async product(id) {
    await wait(120)
    const p = products.find((x) => x.id === Number(id) && x.isActive)
    if (!p) throw new ApiError('Producto no encontrado.', 404)
    return pub(p)
  },

  async login(usuario, contrasena) {
    await wait(400)
    if (String(usuario).toLowerCase().trim() !== DEMO_USER || contrasena !== DEMO_PASS) {
      throw new ApiError('Usuario o contraseña incorrectos.', 401)
    }
    session = { username: DEMO_USER, email: '', csrf: 'demo' }
    return { user: session }
  },
  async logout() { session = null; return { ok: true } },
  async me() { needAuth(); return { user: session } },

  // En la muestra no hay servidor de correo: se valida igual que el real y no se envía nada
  async contact(name, email, message) {
    await wait(500)
    if (!name || !email || !message) throw new ApiError('Todos los campos son obligatorios.', 422)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('El correo no es válido.', 422)
    return { ok: true }
  },
  async forgotPassword() { throw new ApiError('No disponible en la vista de muestra.', 400) },
  async resetPassword() { throw new ApiError('No disponible en la vista de muestra.', 400) },

  async adminProducts() { needAuth(); await wait(150); return { items: products.map((p) => ({ ...p })), max: MAX } },
  async createProduct(form) {
    needAuth(); await wait(350)
    if (products.length >= MAX) throw new ApiError(`Llegaste al máximo de ${MAX} productos. Elimina uno para agregar otro.`, 422)
    const data = readForm(form, true)
    const p = { id: nextId++, ...data }
    products.push(p)
    return { ...p }
  },
  async updateProduct(id, form) {
    needAuth(); await wait(350)
    const p = products.find((x) => x.id === Number(id))
    if (!p) throw new ApiError('Producto no encontrado.', 404)
    const data = readForm(form, false)
    Object.assign(p, { ...data, image: data.image ?? p.image })
    return { ...p }
  },
  async deleteProduct(id) {
    needAuth(); await wait(250)
    products = products.filter((x) => x.id !== Number(id))
    return { ok: true }
  },
}
