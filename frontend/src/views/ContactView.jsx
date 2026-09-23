import { defineComponent } from 'vue'
import PageBanner from '@/components/PageBanner.jsx'
import ContactBlock from '@/sections/ContactBlock.jsx'

export default defineComponent({
  name: 'ContactView',
  setup() {
    return () => (
      <>
        <PageBanner title="Contacto" subtitle="Estamos a un mensaje de distancia." />
        <section class="section"><div class="container"><ContactBlock /></div></section>
      </>
    )
  },
})
