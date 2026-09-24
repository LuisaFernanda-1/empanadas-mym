// Contacto en un solo bloque: a la izquierda pedido por WhatsApp + datos de contacto y redes
// (lo que el emprendimiento tenga); a la derecha el formulario de atención al cliente.
import { defineComponent } from 'vue'
import Icon, { socialIcon, socialLabel } from '@/components/Icon.jsx'
import ContactForm from '@/components/ContactForm.jsx'
import { store } from '@/store/site.js'
import { whatsappLink } from '@/utils/format.js'

export default defineComponent({
  name: 'ContactBlock',
  setup() {
    return () => {
      const c = store.site.contact
      // El WhatsApp no se repite en la lista: ya está el botón "Iniciar conversación"
      const items = [
        c.email && { icon: 'mail', label: 'Correo', value: c.email, href: `mailto:${c.email}` },
        (c.address || c.city) && { icon: 'map-pin', label: 'Ubicación', value: [c.address, c.city].filter(Boolean).join(', '), href: c.mapUrl },
        c.schedule && { icon: 'clock', label: 'Horario de atención', value: c.schedule },
      ].filter(Boolean)

      return (
        <div class="contact">
          <div class="contact__cta">
            <span class="contact__cta-icon"><Icon name="whatsapp" size={30} /></span>
            <h2>¿Listo para hacer tu pedido?</h2>
            <p>Escríbenos por WhatsApp y te respondemos lo antes posible.</p>
            <a href={whatsappLink(c.whatsapp, c.whatsappMessage)} target="_blank" rel="noopener" class="btn btn--light btn--lg">
              <Icon name="whatsapp" size={20} /> Iniciar conversación
            </a>

            {items.length > 0 && (
              <ul class="contact__list">
                {items.map((it) => (
                  <li key={it.label}>
                    <span class="contact__icon"><Icon name={it.icon} size={18} /></span>
                    <div>
                      <small>{it.label}</small>
                      {it.href ? <a href={it.href} target={it.href.startsWith('http') ? '_blank' : undefined} rel="noopener">{it.value}</a> : <span>{it.value}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {store.socials.length > 0 && (
              <div class="contact__socials">
                <small>Síguenos</small>
                <div class="socials">
                  {store.socials.map((r) => (
                    <a key={r.url} href={r.url} target="_blank" rel="noopener" class="socials__link" aria-label={socialLabel(r.network)}>
                      <Icon name={socialIcon(r.network)} size={18} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div class="contact__form">
            <ContactForm plain />
          </div>
        </div>
      )
    }
  },
})
