import { defineComponent, ref, reactive } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import Icon from '@/components/Icon.jsx'
import { store } from '@/store/site.js'
import { login } from '@/store/auth.js'
import { isDemo, DEMO_USER, DEMO_PASS } from '@/config.js'

export default defineComponent({
  name: 'AdminLogin',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const form = reactive({ usuario: '', contrasena: '' })
    const error = ref('')
    const busy = ref(false)
    const show = ref(false)

    async function submit(e) {
      e.preventDefault()
      error.value = ''
      if (!form.usuario.trim() || !form.contrasena) {
        error.value = 'Escribe tu usuario o correo y tu contraseña.'
        return
      }
      busy.value = true
      try {
        await login(form.usuario.trim(), form.contrasena)
        router.replace(route.query.next || '/admin/productos')
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
            <h1>Panel administrativo</h1>
            <p class="login__hint">Ingresa para gestionar tus {s.productsLabel.toLowerCase()}.</p>

            {error.value && <p class="alert alert--error" role="alert">{error.value}</p>}

            <label class="field">
              <span>Usuario o correo</span>
              <div class="field__control">
                <Icon name="user" size={18} />
                <input v-model={form.usuario} autocomplete="username" autofocus placeholder="tu@correo.com" />
              </div>
            </label>
            <label class="field">
              <span>Contraseña</span>
              <div class="field__control">
                <Icon name="lock" size={18} />
                <input v-model={form.contrasena} type={show.value ? 'text' : 'password'} autocomplete="current-password" placeholder="••••••••" />
                <button type="button" class="field__eye" onClick={() => (show.value = !show.value)} aria-label={show.value ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  <Icon name={show.value ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </label>
            <button class="btn btn--primary btn--block btn--lg" disabled={busy.value}>
              {busy.value ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
            <RouterLink to="/admin/olvide-contrasena" class="login__forgot">¿Olvidaste tu contraseña?</RouterLink>
            {isDemo && <p class="demo-note">Vista de muestra: usuario <b>{DEMO_USER}</b> · contraseña <b>{DEMO_PASS}</b>. Los cambios se borran al recargar.</p>}
            <RouterLink to="/" class="login__back"><Icon name="arrow-left" size={16} /> Volver al sitio</RouterLink>
          </form>
        </div>
      )
    }
  },
})
