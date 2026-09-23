import { defineComponent, ref, onMounted } from 'vue'
import PageBanner from '@/components/PageBanner.jsx'
import ProductGrid from '@/sections/ProductGrid.jsx'
import { store, loadProducts } from '@/store/site.js'

export default defineComponent({
  name: 'ProductsView',
  setup() {
    const loading = ref(!store.productsLoaded)
    const error = ref('')
    onMounted(async () => {
      try { await loadProducts() } catch (e) { error.value = e.message } finally { loading.value = false }
    })
    return () => (
      <>
        <PageBanner title={`Nuestros ${store.site.productsLabel.toLowerCase()}`} subtitle={`Descubre todo lo que ${store.site.name} tiene para ti.`} />
        <section class="section">
          <div class="container">
            {error.value ? <p class="alert alert--error">{error.value}</p> : <ProductGrid products={store.products} loading={loading.value} skeletons={8} />}
          </div>
        </section>
      </>
    )
  },
})
