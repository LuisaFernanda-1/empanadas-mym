import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.jsx'

export default defineComponent({
  name: 'NotFoundView',
  setup() {
    return () => (
      <div class="container section empty-state">
        <Icon name="map-pin" size={44} />
        <h1>Página no encontrada</h1>
        <p>La dirección que buscas no existe o cambió.</p>
        <RouterLink to="/" class="btn btn--primary">Ir al inicio</RouterLink>
      </div>
    )
  },
})
