import { defineComponent } from 'vue'
import PageBanner from '@/components/PageBanner.jsx'
import GalleryGrid from '@/sections/GalleryGrid.jsx'
import { store } from '@/store/site.js'

export default defineComponent({
  name: 'GalleryView',
  setup() {
    return () => (
      <>
        <PageBanner title="Galería" subtitle={`Un vistazo a ${store.site.name}.`} image={store.gallery[0]?.image} />
        <section class="section"><div class="container"><GalleryGrid /></div></section>
      </>
    )
  },
})
