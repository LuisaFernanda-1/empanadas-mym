import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.jsx'
import SiteFooter from '@/components/SiteFooter.jsx'
import WhatsAppFloat from '@/components/WhatsAppFloat.jsx'

export default defineComponent({
  name: 'PublicLayout',
  setup() {
    return () => (
      <div class="site">
        <a href="#contenido" class="skip-link">Saltar al contenido</a>
        <SiteHeader />
        <main id="contenido">
          <RouterView />
        </main>
        <SiteFooter />
        <WhatsAppFloat />
      </div>
    )
  },
})
