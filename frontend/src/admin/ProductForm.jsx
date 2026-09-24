// Formulario (modal) para agregar o editar: nombre, precio, descripción, imagen y visibilidad
import { defineComponent, ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Icon from '@/components/Icon.jsx'
import { api } from '@backend'

const MAX_BYTES = 2 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_DESC = 300

export default defineComponent({
  name: 'ProductForm',
  // example: un producto del propio catálogo, para que los ejemplos del formulario sean de este negocio
  props: { product: { type: Object, required: true }, example: { type: Object, default: null } },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const isNew = !props.product.id
    const form = reactive({
      name: props.product.name ?? '',
      price: props.product.price != null ? String(props.product.price) : '',
      description: props.product.description ?? '',
      isActive: props.product.isActive ?? true,
    })
    const file = ref(null)
    const preview = ref(props.product.image ?? null)
    const errors = reactive({})
    const general = ref('')
    const busy = ref(false)
    const dragging = ref(false)
    const descLeft = computed(() => MAX_DESC - form.description.length)
    const exName = props.example?.name ? `Ej: ${props.example.name}` : 'Ej: Nombre de tu producto'
    const exPrice = props.example?.price ? String(Math.round(Number(props.example.price))) : '10000'
    // El mensaje de error de cada campo desaparece en cuanto se corrige
    watch(() => form.name, () => (errors.name = ''))
    watch(() => form.price, () => (errors.price = ''))
    watch(() => form.description, () => (errors.description = ''))

    function pick(f) {
      errors.image = ''
      if (!f) return
      if (!TYPES.includes(f.type)) return (errors.image = 'Formato no permitido. Usa JPG, PNG o WEBP.')
      if (f.size > MAX_BYTES) return (errors.image = `La imagen pesa ${(f.size / 1048576).toFixed(1)} MB. El máximo es 2 MB.`)
      file.value = f
      preview.value = URL.createObjectURL(f)
    }

    function validate() {
      Object.keys(errors).forEach((k) => (errors[k] = ''))
      if (!form.name.trim()) errors.name = 'Escribe el nombre del producto.'
      if (form.price && !/^\d+([.,]\d{1,2})?$/.test(form.price.replace(/[$\s.]/g, ''))) errors.price = `Escribe solo números, sin puntos ni símbolos. Ej: ${exPrice}`
      if (form.description.length > MAX_DESC) errors.description = `Máximo ${MAX_DESC} caracteres.`
      if (isNew && !file.value) errors.image = 'Agrega una imagen del producto.'
      return !Object.values(errors).some(Boolean)
    }

    async function submit(e) {
      e.preventDefault()
      general.value = ''
      if (!validate()) return
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('price', form.price.replace(/[$\s.]/g, ''))
      fd.append('description', form.description.trim())
      fd.append('is_active', form.isActive ? '1' : '0')
      if (file.value) fd.append('image', file.value)
      busy.value = true
      try {
        const saved = isNew ? await api.createProduct(fd) : await api.updateProduct(props.product.id, fd)
        emit('saved', saved, isNew)
      } catch (err) {
        if (err.field) errors[err.field] = err.message
        else general.value = err.message
      } finally {
        busy.value = false
      }
    }

    const onKey = (e) => e.key === 'Escape' && !busy.value && emit('close')
    onMounted(() => { window.addEventListener('keydown', onKey); document.body.classList.add('no-scroll') })
    onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll') })

    return () => (
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pf-title" onMousedown={(e) => e.target === e.currentTarget && !busy.value && emit('close')}>
        <form class="modal__card" onSubmit={submit} novalidate>
          <header class="modal__head">
            <h2 id="pf-title">{isNew ? 'Agregar producto' : 'Editar producto'}</h2>
            <button type="button" class="icon-btn" onClick={() => emit('close')} aria-label="Cerrar"><Icon name="x" size={20} /></button>
          </header>

          <div class="modal__body pf">
            <div
              class={['dropzone', { 'is-drag': dragging.value, 'has-error': errors.image }]}
              onDragover={(e) => { e.preventDefault(); dragging.value = true }}
              onDragleave={() => (dragging.value = false)}
              onDrop={(e) => { e.preventDefault(); dragging.value = false; pick(e.dataTransfer.files[0]) }}
            >
              {preview.value ? <img src={preview.value} alt="Vista previa" /> : (
                <div class="dropzone__empty"><Icon name="image" size={34} /><span>Arrastra una imagen o</span></div>
              )}
              <label class="btn btn--outline btn--sm dropzone__btn">
                {preview.value ? 'Cambiar imagen' : 'Seleccionar imagen'}
                <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onChange={(e) => pick(e.target.files[0])} />
              </label>
              <small class="hint">JPG, PNG o WEBP · máximo 2 MB</small>
              {errors.image && <small class="field__error">{errors.image}</small>}
            </div>

            <div class="pf__fields">
              {general.value && <p class="alert alert--error">{general.value}</p>}
              <label class={['field', { 'has-error': errors.name }]}>
                <span>Nombre *</span>
                <input v-model={form.name} maxlength={120} placeholder={exName} />
                {errors.name && <small class="field__error">{errors.name}</small>}
              </label>
              <label class={['field', { 'has-error': errors.price }]}>
                <span>Precio (COP)</span>
                <div class="field__control field__control--prefix">
                  <b>$</b>
                  <input v-model={form.price} inputmode="numeric" placeholder={exPrice} />
                </div>
                <small class="hint">Déjalo vacío si prefieres mostrar "Consultar precio".</small>
                {errors.price && <small class="field__error">{errors.price}</small>}
              </label>
              <label class={['field', { 'has-error': errors.description }]}>
                <span>Descripción corta</span>
                <textarea v-model={form.description} rows={4} maxlength={MAX_DESC} placeholder="Cuenta en pocas palabras qué hace especial a este producto." />
                <small class={['hint ta-r', { 'field__error': descLeft.value < 0 }]}>{descLeft.value} caracteres disponibles</small>
                {errors.description && <small class="field__error">{errors.description}</small>}
              </label>
              <label class="switch">
                <input type="checkbox" v-model={form.isActive} />
                <span class="switch__track" />
                <span>Mostrar en la página</span>
              </label>
            </div>
          </div>

          <footer class="modal__foot">
            <button type="button" class="btn btn--ghost" onClick={() => emit('close')} disabled={busy.value}>Cancelar</button>
            <button class="btn btn--primary" disabled={busy.value}>{busy.value ? 'Guardando…' : isNew ? 'Agregar producto' : 'Guardar cambios'}</button>
          </footer>
        </form>
      </div>
    )
  },
})
