import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { store } from './store/site.js'

export default defineComponent({
  name: 'App',
  setup() {
    return () => {
      if (store.error)
        return (
          <div class="fatal">
            <h1>Sitio no disponible</h1>
            <p>{store.error}</p>
          </div>
        )
      return store.site ? <RouterView /> : <div class="boot-loader" aria-label="Cargando" />
    }
  },
})
