// Lista de productos del emprendimiento: agregar, editar, eliminar
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.jsx'
import ProductForm from './ProductForm.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { api } from '@backend'
import { store } from '@/store/site.js'
import { formatPrice } from '@/utils/format.js'

export default defineComponent({
  name: 'AdminProducts',
  setup() {
    const router = useRouter()
    const items = ref([])
    const max = ref(10)
    const loading = ref(true)
    const error = ref('')
    const editing = ref(null)        // null = cerrado · {} = nuevo · producto = editar
    const toDelete = ref(null)
    const deleting = ref(false)
    const toast = ref('')
    let toastTimer

    const notify = (msg) => {
      toast.value = msg
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => (toast.value = ''), 3000)
    }

    async function load() {
      loading.value = true
      error.value = ''
      try {
        const data = await api.adminProducts()
        items.value = data.items
        max.value = data.max
      } catch (e) {
        if (e.status === 401) return router.replace('/admin')
        error.value = e.message
      } finally {
        loading.value = false
      }
    }
    onMounted(load)

    function onSaved(product, isNew) {
      if (isNew) items.value.push(product)
      else items.value = items.value.map((p) => (p.id === product.id ? product : p))
      editing.value = null
      store.productsLoaded = false        // el sitio público recargará los datos
      notify(isNew ? 'Producto agregado' : 'Cambios guardados')
    }

    async function confirmDelete() {
      deleting.value = true
      try {
        await api.deleteProduct(toDelete.value.id)
        items.value = items.value.filter((p) => p.id !== toDelete.value.id)
        store.productsLoaded = false
        notify('Producto eliminado')
        toDelete.value = null
      } catch (e) {
        notify(e.message)
      } finally {
        deleting.value = false
      }
    }

    return () => {
      const full = items.value.length >= max.value
      const label = store.site.productsLabel
      return (
        <div class="admin-page">
          <header class="admin-page__head">
            <div>
              <h1>{label}</h1>
              <p>Administra los {label.toLowerCase()} de tu tienda. <span class="counter">{items.value.length} de {max.value}</span></p>
            </div>
            <button class="btn btn--primary" disabled={full || loading.value} onClick={() => (editing.value = {})} title={full ? `Máximo ${max.value}` : ''}>
              <Icon name="plus" size={18} /> Agregar producto
            </button>
          </header>
          {full && <p class="alert alert--info">Llegaste al máximo de {max.value} {label.toLowerCase()}. Elimina uno para agregar otro.</p>}
          {error.value && <p class="alert alert--error">{error.value} <button class="link" onClick={load}>Reintentar</button></p>}

          <div class="table-card">
            {loading.value ? (
              <div class="table-loading">{[1, 2, 3].map((i) => <div key={i} class="skeleton skeleton--row" />)}</div>
            ) : items.value.length === 0 ? (
              <div class="empty-state empty-state--admin">
                <Icon name="package" size={40} />
                <h2>Aún no tienes productos</h2>
                <p>Agrega el primero para que aparezca en tu página.</p>
                <button class="btn btn--primary" onClick={() => (editing.value = {})}><Icon name="plus" size={18} /> Agregar producto</button>
              </div>
            ) : (
              <table class="ptable">
                <thead>
                  <tr><th>Imagen</th><th>Nombre</th><th>Precio</th><th>Estado</th><th class="ta-r">Acciones</th></tr>
                </thead>
                <tbody>
                  {items.value.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Imagen">{p.image ? <img src={p.image} alt="" class="ptable__img" /> : <span class="ptable__img ptable__img--empty"><Icon name="image" size={18} /></span>}</td>
                      <td data-label="Nombre" class="ptable__name">
                        <strong>{p.name}</strong>
                        {p.description && <small>{p.description}</small>}
                      </td>
                      <td data-label="Precio">{formatPrice(p.price)}</td>
                      <td data-label="Estado"><span class={['badge', p.isActive ? 'badge--on' : 'badge--off']}>{p.isActive ? 'Activo' : 'Oculto'}</span></td>
                      <td class="ta-r ptable__actions">
                        <button class="icon-btn" onClick={() => (editing.value = p)} aria-label={`Editar ${p.name}`} title="Editar"><Icon name="edit" size={18} /></button>
                        <button class="icon-btn icon-btn--danger" onClick={() => (toDelete.value = p)} aria-label={`Eliminar ${p.name}`} title="Eliminar"><Icon name="trash" size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {editing.value && <ProductForm product={editing.value} onClose={() => (editing.value = null)} onSaved={onSaved} />}
          {toDelete.value && (
            <ConfirmDialog
              title="¿Eliminar producto?"
              message={`"${toDelete.value.name}" dejará de aparecer en tu página. Esta acción no se puede deshacer.`}
              confirmText="Sí, eliminar"
              busy={deleting.value}
              onConfirm={confirmDelete}
              onCancel={() => (toDelete.value = null)}
            />
          )}
          {toast.value && <div class="toast" role="status"><Icon name="check" size={18} /> {toast.value}</div>}
        </div>
      )
    }
  },
})
