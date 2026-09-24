// Imágenes del sitio: logo, foto de portada, foto de "Quiénes somos" y galería (máx. 3).
// Cada cambio se guarda al elegir la foto; la anterior se borra del servidor.
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { api } from '@backend'
import { store } from '@/store/site.js'

const MAX_BYTES = 2 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

const SLOTS = [
  { key: 'logo', title: 'Logo', hint: 'Aparece arriba en todas las páginas. Mejor en PNG con fondo transparente.', shape: 'logo' },
  { key: 'hero', title: 'Foto de portada', hint: 'La foto grande de la página de inicio. Se muestra cuadrada.', shape: 'square' },
  { key: 'about', title: 'Foto de "Quiénes somos"', hint: 'Acompaña la historia del negocio. Se muestra vertical.', shape: 'tall' },
]

export default defineComponent({
  name: 'AdminSiteImages',
  setup() {
    const router = useRouter()
    const data = ref(null)
    const loading = ref(true)
    const error = ref('')
    const busy = reactive({})          // clave -> true mientras se sube
    const errors = reactive({})        // clave -> mensaje
    const captions = reactive({})      // id de galería -> texto editado
    const toDelete = ref(null)
    const deleting = ref(false)
    const toast = ref('')
    let toastTimer

    const notify = (msg) => {
      toast.value = msg
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => (toast.value = ''), 3000)
    }

    // Lo que se ve en el sitio público se actualiza al instante (y el logo del panel)
    function apply(d) {
      data.value = d
      d.gallery.forEach((g) => { if (!(g.id in captions)) captions[g.id] = g.caption ?? '' })
      if (store.site) {
        store.site.logo = d.logo
        store.site.heroImage = d.hero
        store.site.about.image = d.about
      }
      store.gallery = d.gallery.map(({ image, caption }) => ({ image, caption }))
    }

    async function load() {
      loading.value = true
      error.value = ''
      try {
        apply(await api.siteImages())
      } catch (e) {
        if (e.status === 401) return router.replace('/admin')
        error.value = e.message
      } finally {
        loading.value = false
      }
    }
    onMounted(load)

    function check(key, file) {
      errors[key] = ''
      if (!file) return false
      if (!TYPES.includes(file.type)) { errors[key] = 'Formato no permitido. Usa JPG, PNG o WEBP.'; return false }
      if (file.size > MAX_BYTES) { errors[key] = `La imagen pesa ${(file.size / 1048576).toFixed(1)} MB. El máximo es 2 MB.`; return false }
      return true
    }

    async function run(key, fn, okMsg) {
      busy[key] = true
      try {
        apply(await fn())
        notify(okMsg)
      } catch (e) {
        errors[key] = e.message
      } finally {
        busy[key] = false
      }
    }

    const onPick = (e) => { const f = e.target.files[0]; e.target.value = ''; return f }
    const formWith = (fields) => { const fd = new FormData(); Object.entries(fields).forEach(([k, v]) => v != null && fd.append(k, v)); return fd }

    function changeSlot(slot, e) {
      const file = onPick(e)
      if (!check(slot, file)) return
      run(slot, () => api.setSiteImage(slot, formWith({ image: file })), 'Imagen actualizada')
    }
    function addGallery(e) {
      const file = onPick(e)
      if (!check('new', file)) return
      run('new', () => api.addGalleryImage(formWith({ image: file, caption: '' })), 'Foto agregada a la galería')
    }
    function changeGallery(g, e) {
      const file = onPick(e)
      if (!check(g.id, file)) return
      run(g.id, () => api.updateGalleryImage(g.id, formWith({ image: file, caption: captions[g.id] ?? '' })), 'Foto cambiada')
    }
    function saveCaption(g) {
      run(g.id, () => api.updateGalleryImage(g.id, formWith({ caption: captions[g.id] ?? '' })), 'Descripción guardada')
    }
    async function confirmDelete() {
      deleting.value = true
      try {
        apply(await api.deleteGalleryImage(toDelete.value.id))
        delete captions[toDelete.value.id]
        notify('Foto eliminada de la galería')
        toDelete.value = null
      } catch (e) {
        notify(e.message)
      } finally {
        deleting.value = false
      }
    }

    const picker = (label, onChange, disabled, variant = 'btn--outline') => (
      <label class={['btn btn--sm', variant, { 'is-disabled': disabled }]}>
        {label}
        <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" disabled={disabled} onChange={onChange} />
      </label>
    )

    return () => {
      const d = data.value
      const full = d && d.gallery.length >= d.maxGallery
      return (
        <div class="admin-page">
          <header class="admin-page__head">
            <div>
              <h1>Imágenes del sitio</h1>
              <p>Cambia el logo y las fotos de tu página. Cada cambio se guarda al instante.</p>
            </div>
          </header>
          {error.value && <p class="alert alert--error">{error.value} <button class="link" onClick={load}>Reintentar</button></p>}

          {loading.value ? (
            <div class="simg-grid">{[1, 2, 3].map((i) => <div key={i} class="skeleton simg-skel" />)}</div>
          ) : d && (
            <>
              <h2 class="admin-subtitle">Imágenes principales</h2>
              <div class="simg-grid">
                {SLOTS.map((s) => {
                  const url = d[s.key]
                  return (
                    <article key={s.key} class={['simg-card', { 'is-busy': busy[s.key] }]}>
                      <div class={['simg-card__media', `simg-card__media--${s.shape}`]}>
                        {url ? <img src={url} alt="" /> : <span class="simg-card__empty"><Icon name="image" size={30} />Sin imagen</span>}
                        {busy[s.key] && <span class="simg-card__loading">Subiendo…</span>}
                      </div>
                      <div class="simg-card__body">
                        <h3>{s.title}</h3>
                        <p class="hint">{s.hint}</p>
                        {picker(url ? 'Cambiar imagen' : 'Subir imagen', (e) => changeSlot(s.key, e), busy[s.key])}
                        {errors[s.key] && <small class="field__error">{errors[s.key]}</small>}
                      </div>
                    </article>
                  )
                })}
              </div>

              <h2 class="admin-subtitle">
                Galería <span class="counter">{d.gallery.length} de {d.maxGallery}</span>
              </h2>
              <p class="hint admin-subtitle__hint">Estas fotos aparecen en "Así trabajamos" y en la página Galería.</p>
              <div class="simg-grid">
                {d.gallery.map((g) => {
                  const dirty = (captions[g.id] ?? '') !== (g.caption ?? '')
                  return (
                    <article key={g.id} class={['simg-card', { 'is-busy': busy[g.id] }]}>
                      <div class="simg-card__media simg-card__media--wide">
                        <img src={g.image} alt="" />
                        {busy[g.id] && <span class="simg-card__loading">Guardando…</span>}
                      </div>
                      <div class="simg-card__body">
                        <label class="field simg-card__caption">
                          <span>Descripción (opcional)</span>
                          <input v-model={captions[g.id]} maxlength={120} placeholder="Ej: Así preparamos cada pedido" />
                        </label>
                        <div class="simg-card__actions">
                          {dirty && <button class="btn btn--primary btn--sm" disabled={busy[g.id]} onClick={() => saveCaption(g)}>Guardar descripción</button>}
                          {picker('Cambiar foto', (e) => changeGallery(g, e), busy[g.id])}
                          <button class="icon-btn icon-btn--danger" disabled={busy[g.id]} onClick={() => (toDelete.value = g)} aria-label="Eliminar foto" title="Eliminar"><Icon name="trash" size={18} /></button>
                        </div>
                        {errors[g.id] && <small class="field__error">{errors[g.id]}</small>}
                      </div>
                    </article>
                  )
                })}

                {!full && (
                  <label class={['simg-add', { 'is-busy': busy.new }]}>
                    <Icon name="plus" size={28} />
                    <strong>{busy.new ? 'Subiendo…' : 'Agregar foto'}</strong>
                    <small>JPG, PNG o WEBP · máximo 2 MB</small>
                    <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" disabled={busy.new} onChange={addGallery} />
                    {errors.new && <small class="field__error">{errors.new}</small>}
                  </label>
                )}
              </div>
              {full && <p class="alert alert--info">La galería tiene el máximo de {d.maxGallery} fotos. Puedes cambiar o eliminar una.</p>}
            </>
          )}

          {toDelete.value && (
            <ConfirmDialog
              title="¿Eliminar esta foto?"
              message="Dejará de aparecer en la galería de tu página. Esta acción no se puede deshacer."
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
