import { defineComponent, ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import HeroSlider from '@/sections/HeroSlider.jsx'
import FeatureStrip from '@/sections/FeatureStrip.jsx'
import ProductGrid from '@/sections/ProductGrid.jsx'
import AboutBlock from '@/sections/AboutBlock.jsx'
import GalleryGrid from '@/sections/GalleryGrid.jsx'
import ContactBlock from '@/sections/ContactBlock.jsx'
import SectionHeading from '@/components/SectionHeading.jsx'
import Icon from '@/components/Icon.jsx'
import { store, loadProducts } from '@/store/site.js'

export default defineComponent({
  name: 'HomeView',
  setup() {
    const loading = ref(!store.productsLoaded)
    onMounted(async () => {
      try { await loadProducts() } finally { loading.value = false }
    })
    const featured = computed(() => store.products.slice(0, 4))

    return () => (
      <>
        <HeroSlider />
        <FeatureStrip />

        <section class="section">
          <div class="container">
            <SectionHeading eyebrow="Lo que ofrecemos" title={`Nuestros ${store.site.productsLabel.toLowerCase()}`}>
              <RouterLink to="/productos" class="link-arrow">Ver todos <Icon name="arrow-right" size={16} /></RouterLink>
            </SectionHeading>
            <ProductGrid products={featured.value} loading={loading.value} />
          </div>
        </section>

        <section class="section section--soft">
          <div class="container"><AboutBlock summary /></div>
        </section>

        {(store.gallery.length > 0 || store.site.heroImage) && (
          <section class="section">
            <div class="container">
              <SectionHeading eyebrow="Galería" title="Así trabajamos" />
              <GalleryGrid />
            </div>
          </section>
        )}

        <section class="section section--soft">
          <div class="container"><ContactBlock /></div>
        </section>
      </>
    )
  },
})
