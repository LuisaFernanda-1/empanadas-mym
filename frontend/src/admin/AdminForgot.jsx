import { defineComponent, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.jsx'
import { store } from '@/store/site.js'
import { api } from '@/services/http.js'

export default defineComponent({
  name: 'AdminForgot',
  setup() {
    const email = ref('')
    const error = ref('')
    const success = ref(false)
    const busy = ref(false)

    async function submit(e) {
      e.preventDefault()
      error.value = ''
      if (!email.value.trim()) {
        error.value = 'Escribe tu correo electrónico.'
        return
      }
      busy.value = true
      try {
        await api.forgotPassword(email.value.trim())
        success.value = true
      } catch (err) {
        error.value = err.message
      } finally {
        busy.value = false
      }
    }

    return () => {
      const s = store.site
      return (
        <div class="login">
          <form class="login__card" onSubmit={submit} novalidate>
            <div class="login__brand">
              {s.logo && <img src={s.logo} alt="" />}
              <span>{s.name}</span>
            </div>
            <h1>Recuperar contraseña</h1>
            <p class="login__hint">Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>

            {error.value && <p class="alert alert--error" role="alert">{error.value}</p>}

            {success.value ? (
              <p class="alert alert--success" role="status">
                Si ese correo está registrado, recibirás el enlace en unos minutos. Revisa también tu carpeta de spam.
              </p>
            ) : (
              <>
                <label class="field">
                  <span>Correo electrónico</span>
                  <div class="field__control">
                    <Icon name="mail" size={18} />
                    <input v-model={email.value} type="email" autocomplete="email" autofocus placeholder="tu@correo.com" />
                  </div>
                </label>
                <button class="btn btn--primary btn--block btn--lg" disabled={busy.value}>
                  {busy.value ? 'Enviando…' : 'Enviar enlace'}
                </button>
              </>
            )}

            <RouterLink to="/admin" class="login__back"><Icon name="arrow-left" size={16} /> Volver al inicio de sesión</RouterLink>
          </form>
        </div>
      )
    }
  },
})
