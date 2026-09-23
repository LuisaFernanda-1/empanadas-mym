// Botón flotante de WhatsApp, visible en todas las páginas públicas
import { defineComponent } from 'vue'
import Icon from './Icon.jsx'
import { store } from '@/store/site.js'
import { whatsappLink } from '@/utils/format.js'

export default defineComponent({
  name: 'WhatsAppFloat',
  setup() {
    return () => (
      <a
        class="wa-float"
        href={whatsappLink(store.site.contact.whatsapp, store.site.contact.whatsappMessage)}
        target="_blank"
        rel="noopener"
        aria-label="Escríbenos por WhatsApp"
      >
        <Icon name="whatsapp" size={30} />
        <span class="wa-float__tip">¿Hablamos?</span>
      </a>
    )
  },
})
