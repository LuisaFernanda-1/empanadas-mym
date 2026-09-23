// Franja de beneficios bajo la portada (hasta 3)
import { defineComponent } from 'vue'
import Icon from '@/components/Icon.jsx'
import { store } from '@/store/site.js'

export default defineComponent({
  name: 'FeatureStrip',
  setup() {
    return () =>
      store.features.length > 0 && (
        <section class="features">
          <div class="container features__grid">
            {store.features.map((f) => (
              <div class="feature" key={f.title}>
                <span class="feature__icon"><Icon name={f.icon} size={24} /></span>
                <div>
                  <strong>{f.title}</strong>
                  {f.subtitle && <span>{f.subtitle}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )
  },
})
