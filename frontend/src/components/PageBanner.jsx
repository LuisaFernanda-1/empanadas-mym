// Banner superior de las páginas internas: color sólido de la marca con detalles suaves
// (sin foto: las fotos de los emprendedores suelen ser pequeñas y se ven borrosas estiradas)
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PageBanner',
  props: { title: String, subtitle: String },
  setup(props) {
    return () => (
      <section class="page-banner">
        <div class="container page-banner__inner">
          <h1>{props.title}</h1>
          {props.subtitle && <p>{props.subtitle}</p>}
        </div>
      </section>
    )
  },
})
