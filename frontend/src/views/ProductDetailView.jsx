// Detalle de producto con cantidad y pedido directo por WhatsApp
import { defineComponent, ref, computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Icon from '@/components/Icon.jsx'
import ProductCard from '@/components/ProductCard.jsx'
import { store, loadProducts } from '@/store/site.js'
import { api } from '@backend'
import { formatPrice, whatsappLink, productMessage } from '@/utils/format.js'

export default defineComponent({
  name: 'ProductDetailView',
  setup() {
    const route = useRoute()
    const product = ref(null)
    const qty = ref(1)
    const state = ref('loading')

    async function load() {
      state.value = 'loading'
      qty.value = 1
      try {
        const id = Number(route.params.id)
        product.value = store.products.find((p) => p.id === id) ?? (await api.product(id))
        state.value = 'ok'
        document.title = `${product.value.name} | ${store.site.name}`
        loadProducts().catch(() => {})
      } catch {
        state.value = 'notfound'
      }
    }
    watch(() => route.params.id, (id) => id && load(), { immediate: true })

    const others = computed(() => store.products.filter((p) => p.id !== product.value?.id).slice(0, 4))

    return () => {
      if (state.value === 'loading') return <div class="container section"><div class="detail"><div class="skeleton detail__skeleton" /><div /></div></div>
      if (state.value === 'notfound')
        return (
          <div class="container section empty-state">
            <Icon name="package" size={44} />
            <h1>Producto no disponible</h1>
            <p>Es posible que ya no esté en el catálogo.</p>
            <RouterLink to="/productos" class="btn btn--primary">Ver {store.site.productsLabel.toLowerCase()}</RouterLink>
          </div>
        )

      const p = product.value
      const order = whatsappLink(store.site.contact.whatsapp, productMessage(p, qty.value, store.site.name))
      return (
        <>
          <section class="section section--first">
            <div class="container">
              <RouterLink to="/productos" class="back-link"><Icon name="arrow-left" size={16} /> Volver a {store.site.productsLabel.toLowerCase()}</RouterLink>
              <div class="detail">
                <div class="detail__media">
                  {p.image ? <img src={p.image} alt={p.name} /> : <div class="img-placeholder"><Icon name="image" size={48} /></div>}
                </div>
                <div class="detail__body">
                  <p class="eyebrow">{store.site.name}</p>
                  <h1>{p.name}</h1>
                  <p class={['detail__price', { 'price--ask': p.price == null }]}>{formatPrice(p.price)}</p>
                  {p.description && <p class="detail__desc">{p.description}</p>}

                  <div class="detail__buy">
                    <div class="qty" role="group" aria-label="Cantidad">
                      <button onClick={() => qty.value > 1 && qty.value--} aria-label="Menos" disabled={qty.value <= 1}><Icon name="minus" size={16} /></button>
                      <output aria-live="polite">{qty.value}</output>
                      <button onClick={() => qty.value < 99 && qty.value++} aria-label="Más"><Icon name="plus" size={16} /></button>
                    </div>
                    <a href={order} target="_blank" rel="noopener" class="btn btn--primary btn--lg detail__cta">
                      <Icon name="whatsapp" size={20} /> {p.price == null ? 'Consultar por WhatsApp' : 'Comprar por WhatsApp'}
                    </a>
                  </div>

                  {store.features.length > 0 && (
                    <ul class="detail__perks">
                      {store.features.map((f) => <li key={f.title}><Icon name={f.icon} size={18} /> {f.title}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
          {others.value.length > 0 && (
            <section class="section section--soft">
              <div class="container">
                <h2 class="h-sub">También te puede gustar</h2>
                <div class="product-grid">{others.value.map((o) => <ProductCard key={o.id} product={o} />)}</div>
              </div>
            </section>
          )}
        </>
      )
    }
  },
})
