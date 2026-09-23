import { defineComponent, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Icon from '@/components/Icon.jsx'
import { store } from '@/store/site.js'
import { api } from '@/services/http.js'

export default defineComponent({
  name: 'AdminReset',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const password = ref('')
    const confirm = ref('')
    const showPass = ref(false)
    const showConfirm = ref(false)
    const error = ref('')
    const busy = ref(false)

    const token = route.query.token

    async function submit(e) {
      e.preventDefault()
      error.value = ''
      if (!password.value || password.value.length < 8) {
        error.value = 'La contraseña debe tener al menos 8 caracteres.'
        return
      }
      if (password.value !== confirm.value) {
        error.value = 'Las contraseñas no coinciden.'
        return
      }
      if (!token) {
        error.value = 'Enlace inválido. Solicita uno nuevo.'
        return
      }
      busy.value = true
      try {
        await api.resetPassword(token, password.value)
        router.replace('/admin?reset=1')
      } catch (err) {
        error.value = err.message
      } finally {
        busy.value = false
      }
    }

    return () => {
      const s = store.site
      if (!token) {
        return (
          <div class="login">
            <div class="login__card">
              <p class="alert alert--error">Enlace inválido o expirado.</p>
              <RouterLink to="/admin/olvide-contrasena" class="login__back"><Icon name="arrow-left" size={16} /> Solicitar nuevo enlace</RouterLink>
            </div>
          </div>
        )
      }
      return (
        <div class="login">
          <form class="login__card" onSubmit={submit} novalidate>
            <div class="login__brand">
              {s.logo && <img src={s.logo} alt="" />}
              <span>{s.name}</span>
            </div>
            <h1>Nueva contraseña</h1>
            <p class="login__hint">Elige una contraseña segura de al menos 8 caracteres.</p>

            {error.value && <p class="alert alert--error" role="alert">{error.value}</p>}

            <label class="field">
              <span>Nueva contraseña</span>
              <div class="field__control">
                <Icon name="lock" size={18} />
                <input v-model={password.value} type={showPass.value ? 'text' : 'password'} autocomplete="new-password" autofocus placeholder="••••••••" />
                <button type="button" class="field__eye" onClick={() => (showPass.value = !showPass.value)} aria-label={showPass.value ? 'Ocultar' : 'Mostrar'}>
                  <Icon name={showPass.value ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </label>
            <label class="field">
              <span>Confirmar contraseña</span>
              <div class="field__control">
                <Icon name="lock" size={18} />
                <input v-model={confirm.value} type={showConfirm.value ? 'text' : 'password'} autocomplete="new-password" placeholder="••••••••" />
                <button type="button" class="field__eye" onClick={() => (showConfirm.value = !showConfirm.value)} aria-label={showConfirm.value ? 'Ocultar' : 'Mostrar'}>
                  <Icon name={showConfirm.value ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </label>
            <button class="btn btn--primary btn--block btn--lg" disabled={busy.value}>
              {busy.value ? 'Guardando…' : 'Guardar contraseña'}
            </button>
            <RouterLink to="/admin" class="login__back"><Icon name="arrow-left" size={16} /> Ir al inicio de sesión</RouterLink>
          </form>
        </div>
      )
    }
  },
})
