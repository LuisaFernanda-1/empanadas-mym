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
  { key: 'logo', title: 'Logo', hint: 'Arriba en todas las páginas. Ideal: PNG con fondo transparente.', shape: 'logo' },
  { key: 'hero', title: 'Foto de portada', hint: 'La foto grande de la página de inicio.', shape: 'square' },
  { key: 'about', title: 'Foto de "Quiénes somos"', hint: 'Acompaña la historia del negocio.', shape: 'square' },
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
          <header class="admin-hero">
            <div class="admin-hero__text">
              <span class="admin-hero__eyebrow">Panel de {store.site.name}</span>
              <h1>Imágenes del sitio</h1>
              <p>Cambia el logo y las fotos de tu página. Cada cambio se guarda al instante.</p>
            </div>
            <span class="admin-hero__icon" aria-hidden="true"><Icon name="image" size={34} /></span>
          </header>
          {error.value && <p class="alert alert--error">{error.value} <button class="link" onClick={load}>Reintentar</button></p>}

          {loading.value ? (
            <section class="simg-panel">
              <div class="table-loading">{[1, 2, 3].map((i) => <div key={i} class="skeleton skeleton--row" />)}</div>
            </section>
          ) : d && (
            <div class="simg-layout">
              <section class="simg-panel">
                <header class="simg-panel__head">
                  <h2>Imágenes principales</h2>
                  <p>JPG, PNG o WEBP · máximo 2 MB</p>
                </header>
                <ul class="simg-list">
                  {SLOTS.map((s) => {
                    const url = d[s.key]
                    return (
                      <li key={s.key} class="simg-row">
                        <div class={['simg-thumb', `simg-thumb--${s.shape}`]}>
                          {url ? <img src={url} alt="" /> : <Icon name="image" size={22} />}
                          {busy[s.key] && <span class="simg-thumb__busy" />}
                        </div>
                        <div class="simg-row__info">
                          <strong>{s.title}</strong>
                          <span>{s.hint}</span>
                          {errors[s.key] && <small class="field__error">{errors[s.key]}</small>}
                        </div>
                        <div class="simg-row__actions">
                          {picker(busy[s.key] ? 'Subiendo…' : url ? 'Cambiar' : 'Subir', (e) => changeSlot(s.key, e), busy[s.key])}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <section class="simg-panel">
                <header class="simg-panel__head">
                  <h2>Galería <span class="counter">{d.gallery.length} de {d.maxGallery}</span></h2>
                  <p>Aparecen en "Así trabajamos" y en la página Galería.</p>
                </header>
                <ul class="simg-list">
                  {d.gallery.length === 0 && <li class="simg-empty">Aún no hay fotos en la galería.</li>}
                  {d.gallery.map((g, i) => {
                    const dirty = (captions[g.id] ?? '') !== (g.caption ?? '')
                    return (
                      <li key={g.id} class="simg-row simg-row--gallery">
                        <div class="simg-thumb simg-thumb--wide">
                          <img src={g.image} alt="" />
                          {busy[g.id] && <span class="simg-thumb__busy" />}
                        </div>
                        <div class="simg-row__info">
                          <div class="simg-row__top">
                            <strong>Foto {i + 1}</strong>
                            <div class="simg-row__actions">
                              {picker('Cambiar', (e) => changeGallery(g, e), busy[g.id])}
                              <button class="icon-btn icon-btn--danger" disabled={busy[g.id]} onClick={() => (toDelete.value = g)} aria-label={`Eliminar foto ${i + 1}`} title="Eliminar"><Icon name="trash" size={18} /></button>
                            </div>
                          </div>
                          <div class="simg-caption">
                            <input v-model={captions[g.id]} maxlength={120} placeholder="Descripción (opcional)" aria-label={`Descripción de la foto ${i + 1}`}
                              onKeydown={(e) => e.key === 'Enter' && dirty && saveCaption(g)} />
                            {dirty && <button class="btn btn--primary btn--sm" disabled={busy[g.id]} onClick={() => saveCaption(g)}>Guardar</button>}
                          </div>
                          {errors[g.id] && <small class="field__error">{errors[g.id]}</small>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <footer class="simg-panel__foot">
                  {full ? (
                    <span class="hint">La galería está completa. Cambia o elimina una foto para poner otra.</span>
                  ) : (
                    <label class={['simg-add', { 'is-disabled': busy.new }]}>
                      <Icon name="plus" size={18} /> {busy.new ? 'Subiendo…' : 'Agregar foto'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" disabled={busy.new} onChange={addGallery} />
                    </label>
                  )}
                  {errors.new && <small class="field__error">{errors.new}</small>}
                </footer>
              </section>
            </div>
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
