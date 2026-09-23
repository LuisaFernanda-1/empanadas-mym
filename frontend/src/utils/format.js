// Utilidades compartidas por el sitio público y el panel

const cop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/** 18000 -> "$ 18.000" · null -> "Consultar precio" */
export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return 'Consultar precio'
  return `$ ${cop.format(Number(value))}`
}

/** Enlace de WhatsApp con mensaje prellenado */
export function whatsappLink(number, message = '') {
  const digits = String(number || '').replace(/\D/g, '')
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

/** Mensaje de pedido para un producto */
export function productMessage(product, qty = 1, siteName = '') {
  const price = product.price != null ? ` (${formatPrice(product.price)} c/u)` : ''
  return `¡Hola${siteName ? ' ' + siteName : ''}! Quiero pedir ${qty} x ${product.name}${price}. ¿Me ayudas con la información de pago y envío?`
}

/** "573001234567" -> "+57 300 123 4567" (solo para mostrar) */
export function prettyPhone(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('57')) return `+57 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  return d ? `+${d}` : ''
}
