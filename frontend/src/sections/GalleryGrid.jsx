// Galería: imagen principal + hasta 3 adicionales, con visor ampliado
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Icon from '@/components/Icon.jsx'
import { store } from '@/store/site.js'

export default defineComponent({
  name: 'GalleryGrid',
  setup() {
    const current = ref(-1)
    const items = computed(() => [
      ...(store.site.heroImage ? [{ image: store.site.heroImage, caption: store.site.name }] : []),
      ...store.gallery,
    ])
    const close = () => (current.value = -1)
    const move = (d) => (current.value = (current.value + d + items.value.length) % items.value.length)
    const onKey = (e) => {
      if (current.value < 0) return
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') move(1)
      if (e.key === 'ArrowLeft') move(-1)
    }
    onMounted(() => window.addEventListener('keydown', onKey))
    onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

    return () => (
      <>
        <div class={['gallery', `gallery--${Math.min(items.value.length, 4)}`]}>
          {items.value.map((g, i) => (
            <button key={g.image} class="gallery__item" onClick={() => (current.value = i)} aria-label={`Ampliar: ${g.caption || 'imagen ' + (i + 1)}`}>
              <img src={g.image} alt={g.caption || ''} loading="lazy" />
              {g.caption && <span class="gallery__caption">{g.caption}</span>}
            </button>
          ))}
        </div>
        {current.value >= 0 && (
          <div class="lightbox" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && close()}>
            <button class="lightbox__close" onClick={close} aria-label="Cerrar"><Icon name="x" size={26} /></button>
            {items.value.length > 1 && <button class="lightbox__nav lightbox__nav--prev" onClick={() => move(-1)} aria-label="Anterior"><Icon name="chevron-left" size={28} /></button>}
            <figure>
              <img src={items.value[current.value].image} alt={items.value[current.value].caption || ''} />
              {items.value[current.value].caption && <figcaption>{items.value[current.value].caption}</figcaption>}
            </figure>
            {items.value.length > 1 && <button class="lightbox__nav lightbox__nav--next" onClick={() => move(1)} aria-label="Siguiente"><Icon name="chevron-right" size={28} /></button>}
          </div>
        )}
      </>
    )
  },
})
