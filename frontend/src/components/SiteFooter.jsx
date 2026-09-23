import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import Brand from './Brand.jsx'
import Icon, { socialIcon, socialLabel } from './Icon.jsx'
import { navLinks } from './SiteHeader.jsx'
import { store } from '@/store/site.js'
import { whatsappLink, prettyPhone } from '@/utils/format.js'

export default defineComponent({
  name: 'SiteFooter',
  setup() {
    return () => {
      const s = store.site
      const c = s.contact
      return (
        <footer class="footer">
          <div class="container footer__grid">
            <div class="footer__about">
              <Brand light />
              <p>{s.heroText}</p>
              {store.socials.length > 0 && (
                <div class="socials">
                  {store.socials.map((r) => (
                    <a key={r.url} href={r.url} target="_blank" rel="noopener" class="socials__link" aria-label={socialLabel(r.network)}>
                      <Icon name={socialIcon(r.network)} size={18} />
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 class="footer__title">Navegación</h3>
              <ul class="footer__list">
                {navLinks().map((l) => (
                  <li key={l.to}><RouterLink to={l.to}>{l.label}</RouterLink></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 class="footer__title">Contacto</h3>
              <ul class="footer__list footer__list--icons">
                <li><Icon name="whatsapp" size={16} /><a href={whatsappLink(c.whatsapp, c.whatsappMessage)} target="_blank" rel="noopener">{c.phone || prettyPhone(c.whatsapp)}</a></li>
                {c.email && <li><Icon name="mail" size={16} /><a href={`mailto:${c.email}`}>{c.email}</a></li>}
                {(c.address || c.city) && <li><Icon name="map-pin" size={16} /><span>{[c.address, c.city].filter(Boolean).join(', ')}</span></li>}
                {c.schedule && <li><Icon name="clock" size={16} /><span>{c.schedule}</span></li>}
              </ul>
            </div>
          </div>
          <div class="footer__bottom">
            <div class="container footer__bottom-inner">
              <span>© {new Date().getFullYear()} {s.name}. Todos los derechos reservados.</span>
              <RouterLink to="/admin" class="footer__admin"><Icon name="lock" size={14} /> Administrar productos</RouterLink>
            </div>
          </div>
        </footer>
      )
    }
  },
})
