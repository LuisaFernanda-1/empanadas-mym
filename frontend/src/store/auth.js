// Sesión del panel administrativo
import { reactive } from 'vue'
import { api, setCsrf } from '@backend'

export const auth = reactive({ user: null, checked: false })

export async function checkSession() {
  if (auth.checked) return auth.user
  try {
    const { user } = await api.me()
    setUser(user)
  } catch {
    setUser(null)
  }
  auth.checked = true
  return auth.user
}

export async function login(usuario, contrasena) {
  const { user } = await api.login(usuario, contrasena)
  setUser(user)
  auth.checked = true
}

export async function logout() {
  try {
    await api.logout()
  } finally {
    setUser(null)
  }
}

function setUser(user) {
  auth.user = user
  setCsrf(user?.csrf ?? null)
}
