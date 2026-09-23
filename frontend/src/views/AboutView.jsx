import { defineComponent } from 'vue'
import PageBanner from '@/components/PageBanner.jsx'
import AboutBlock from '@/sections/AboutBlock.jsx'
import FeatureStrip from '@/sections/FeatureStrip.jsx'
import { store } from '@/store/site.js'

export default defineComponent({
  name: 'AboutView',
  setup() {
    return () => (
      <>
        <PageBanner title="Quiénes somos" subtitle={`Conoce la historia detrás de ${store.site.name}.`} image={store.site.about.image} />
        <section class="section"><div class="container"><AboutBlock /></div></section>
        <FeatureStrip />
      </>
    )
  },
})
