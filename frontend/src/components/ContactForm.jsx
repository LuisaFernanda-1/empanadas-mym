import { defineComponent, reactive, ref } from 'vue'
import Icon from '@/components/Icon.jsx'
import { api } from '@/services/http.js'

export default defineComponent({
  name: 'ContactForm',
  // plain: sin tarjeta propia (cuando va dentro del bloque de contacto)
  props: { plain: Boolean },
  setup(props) {
    // website: campo trampa invisible; si viene lleno es un robot de spam
    const form = reactive({ name: '', email: '', message: '', website: '' })
    const error = ref('')
    const success = ref(false)
    const busy = ref(false)

    async function submit(e) {
      e.preventDefault()
      error.value = ''
      if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
        error.value = 'Todos los campos son obligatorios.'
        return
      }
      busy.value = true
      try {
        await api.contact(form.name.trim(), form.email.trim(), form.message.trim(), form.website)
        success.value = true
        form.name = ''
        form.email = ''
        form.message = ''
      } catch (err) {
        error.value = err.message
      } finally {
        busy.value = false
      }
    }

    return () => (
      <div class={['contact-form', { 'contact-form--plain': props.plain }]} id="atencion-al-cliente">
        <span class="contact-form__icon"><Icon name="mail" size={26} /></span>
        <h2 class="contact-form__title">Atención al cliente</h2>
        <p class="contact-form__subtitle">
          ¿Tienes una consulta, una solicitud de información o alguna inquietud sobre nuestros productos?
          Déjanos tus datos y te responderemos a tu correo lo antes posible.
        </p>

        {success.value && (
          <p class="alert alert--success" role="status">
            ¡Gracias por escribirnos! Recibimos tu mensaje y te responderemos pronto.
          </p>
        )}

        {error.value && <p class="alert alert--error" role="alert">{error.value}</p>}

        <form onSubmit={submit} novalidate>
          <label class="field">
            <span>Nombre</span>
            <div class="field__control">
              <Icon name="user" size={18} />
              <input v-model={form.name} type="text" autocomplete="name" placeholder="Tu nombre" />
            </div>
          </label>
          <label class="field">
            <span>Correo electrónico</span>
            <div class="field__control">
              <Icon name="mail" size={18} />
              <input v-model={form.email} type="email" autocomplete="email" placeholder="tu@correo.com" />
            </div>
          </label>
          <label class="field">
            <span>Mensaje</span>
            <textarea v-model={form.message} class="field__textarea" rows={5} maxlength={2000} placeholder="¿En qué podemos ayudarte?" />
          </label>
          <label class="contact-form__trap" aria-hidden="true">
            Sitio web <input v-model={form.website} type="text" tabindex={-1} autocomplete="off" />
          </label>
          <button class="btn btn--primary btn--block" disabled={busy.value}>
            {busy.value ? 'Enviando…' : <><Icon name="mail" size={18} /> Enviar mensaje</>}
          </button>
        </form>
      </div>
    )
  },
})
