// Portada: fondo crema claro, título con acento de marca, botones y la imagen
// principal (+ galería como carrusel) en un marco. Termina en ondas suaves.
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.jsx'
import { store } from '@/store/site.js'
import { whatsappLink, formatPrice } from '@/utils/format.js'

export default defineComponent({
  name: 'HeroSlider',
  setup() {
    const index = ref(0)
    const slides = computed(() => [store.site.heroImage, ...store.gallery.map((g) => g.image)].filter(Boolean))
    let timer = null
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const go = (step) => {
      const n = slides.value.length
      if (n) index.value = (index.value + step + n) % n
    }
    const start = () => {
      stop()
      if (!reduced && slides.value.length > 1) timer = setInterval(() => go(1), 5000)
    }
    const stop = () => timer && clearInterval(timer)
    onMounted(start)
    onBeforeUnmount(stop)

    return () => {
      const s = store.site
      const many = slides.value.length > 1
      // La última palabra del título se resalta con el color de la marca y un trazo a mano
      const words = (s.heroTitle || '').trim().split(/\s+/)
      const last = words.pop()
      // Etiqueta flotante: precio más bajo del catálogo ("Desde $ 2.000")
      const prices = store.products.map((p) => p.price).filter((p) => p !== null && p !== undefined && p !== '').map(Number)
      const badge = prices.length > 0 && { icon: 'star', title: `Desde ${formatPrice(Math.min(...prices))}`, subtitle: '100% caseras' }
      return (
        <section class="hero">
          <div class="container hero__inner">
            <div class="hero__content">
              {s.tagline && <p class="hero__eyebrow">{s.tagline}</p>}
              <h1 class="hero__title">
                {words.join(' ')}{words.length > 0 && ' '}
                <span class="hero__accent">
                  {last}
                  <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 10 C 50 3, 120 2, 197 8" /></svg>
                </span>
              </h1>
              <p class="hero__text">{s.heroText}</p>
              <div class="hero__actions">
                <RouterLink to="/productos" class="btn btn--primary btn--lg">
                  Ver {s.productsLabel.toLowerCase()} <Icon name="arrow-right" size={18} />
                </RouterLink>
                <a href={whatsappLink(s.contact.whatsapp, s.contact.whatsappMessage)} target="_blank" rel="noopener" class="btn btn--outline btn--lg">
                  <Icon name="whatsapp" size={20} /> Escríbenos
                </a>
              </div>
            </div>

            {slides.value.length > 0 && (
              <div class="hero__media" onMouseenter={stop} onMouseleave={start}>
                <div class="hero__frame" aria-hidden="true">
                  {slides.value.map((src, i) => (
                    <img key={src} src={src} alt="" class={['hero__img', { 'is-active': i === index.value }]} fetchpriority={i === 0 ? 'high' : 'low'} />
                  ))}
                </div>
                {badge && (
                  <div class="hero__badge">
                    <span class="hero__badge-icon"><Icon name={badge.icon} size={20} /></span>
                    <div>
                      <strong>{badge.title}</strong>
                      {badge.subtitle && <span>{badge.subtitle}</span>}
                    </div>
                  </div>
                )}
                {many && (
                  <div class="hero__dots">
                    {slides.value.map((_, i) => (
                      <button key={i} class={{ 'is-active': i === index.value }} aria-label={`Ir a la imagen ${i + 1}`} onClick={() => { index.value = i; start() }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <svg class="hero__wave" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true">
            <path class="hero__wave-back" d="M0,70 C160,150 340,160 540,96 C740,32 900,10 1100,62 C1260,104 1360,110 1440,84 L1440,180 L0,180 Z" />
            <path class="hero__wave-mid" d="M0,112 C180,58 380,40 600,98 C820,156 1020,160 1220,112 C1320,88 1390,80 1440,86 L1440,180 L0,180 Z" />
            <path class="hero__wave-front" d="M0,140 C200,96 420,90 660,128 C900,166 1110,168 1300,138 C1370,126 1410,120 1440,122 L1440,180 L0,180 Z" />
          </svg>
        </section>
      )
    }
  },
})
