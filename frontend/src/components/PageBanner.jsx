// Banner superior de las páginas internas (usa la imagen principal con capa de color)
import { defineComponent } from 'vue'
import { store } from '@/store/site.js'

export default defineComponent({
  name: 'PageBanner',
  props: { title: String, subtitle: String, image: String },
  setup(props) {
    return () => (
      <section class="page-banner" style={{ '--banner-img': `url("${props.image || store.site.heroImage || ''}")` }}>
        <div class="container page-banner__inner">
          <h1>{props.title}</h1>
          {props.subtitle && <p>{props.subtitle}</p>}
        </div>
      </section>
    )
  },
})
