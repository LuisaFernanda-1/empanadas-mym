// Cliente de la API PHP. El dominio visitado determina el emprendimiento,
// por eso el frontend nunca envía un "id de sitio": es el mismo código para los 45.
// En modo demo (vista previa sin servidor) vite.config.js reemplaza este archivo por demo.js.
import { ApiError } from './errors.js'
export { ApiError }

let csrfToken = null
export const setCsrf = (token) => (csrfToken = token)

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = { Accept: 'application/json' }
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  let payload
  if (form) payload = form
  else if (body) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload, credentials: 'same-origin' })
  } catch {
    throw new ApiError('No hay conexión. Revisa tu internet e inténtalo de nuevo.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || 'Ocurrió un error inesperado.', res.status, data.field)
  return data
}

export const api = {
  site: () => request('/site'),
  products: () => request('/products'),
  product: (id) => request(`/products/${id}`),

  login: (usuario, contrasena) => request('/auth/login', { method: 'POST', body: { usuario, contrasena } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  contact: (name, email, message, website = '') => request('/contact', { method: 'POST', body: { name, email, message, website } }),

  forgotPassword: (email) => request('/auth/forgot', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/auth/reset', { method: 'POST', body: { token, password } }),

  adminProducts: () => request('/admin/products'),
  createProduct: (form) => request('/admin/products', { method: 'POST', form }),
  updateProduct: (id, form) => request(`/admin/products/${id}`, { method: 'POST', form }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),

  siteImages: () => request('/admin/site-images'),
  setSiteImage: (slot, form) => request(`/admin/site-images/${slot}`, { method: 'POST', form }),   // slot: logo | hero | about
  addGalleryImage: (form) => request('/admin/gallery', { method: 'POST', form }),
  updateGalleryImage: (id, form) => request(`/admin/gallery/${id}`, { method: 'POST', form }),
  deleteGalleryImage: (id) => request(`/admin/gallery/${id}`, { method: 'DELETE' }),
}
