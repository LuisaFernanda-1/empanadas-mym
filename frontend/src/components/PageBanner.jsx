// Banner superior de las páginas internas. Mismo lenguaje que la portada: fondo crema claro,
// título oscuro con acento de marca y ondas en capas (sin foto: suelen ser pequeñas y se ven borrosas)
import { defineComponent } from 'vue'
import { store } from '@/store/site.js'

export default defineComponent({
  name: 'PageBanner',
  props: { title: String, subtitle: String },
  setup(props) {
    return () => (
      <section class="page-banner">
        <div class="container page-banner__inner">
          <p class="page-banner__eyebrow">{store.site.name}</p>
          <h1>{props.title}</h1>
          {props.subtitle && <p class="page-banner__text">{props.subtitle}</p>}
        </div>
        <svg class="page-banner__wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path class="page-banner__wave-back" d="M0,38 C220,78 460,84 700,52 C940,20 1180,14 1440,44 L1440,90 L0,90 Z" />
          <path class="page-banner__wave-front" d="M0,62 C240,40 470,38 720,58 C970,78 1200,80 1440,62 L1440,90 L0,90 Z" />
        </svg>
      </section>
    )
  },
})
