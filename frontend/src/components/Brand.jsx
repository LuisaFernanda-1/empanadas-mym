// Logo + nombre del emprendimiento (se usa en encabezado, pie y panel)
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import { store } from '@/store/site.js'

export default defineComponent({
  name: 'Brand',
  props: { to: { type: String, default: '/' }, light: Boolean, compact: Boolean },
  setup(props) {
    return () => {
      const s = store.site
      if (!s) return null
      return (
        <RouterLink to={props.to} class={['brand', { 'brand--light': props.light, 'brand--compact': props.compact }]} aria-label={`${s.name} - inicio`}>
          {s.logo && <img src={s.logo} alt={s.showNameInLogo ? '' : s.name} class="brand__logo" />}
          {(s.showNameInLogo || !s.logo) && <span class="brand__name">{s.name}</span>}
        </RouterLink>
      )
    }
  },
})
