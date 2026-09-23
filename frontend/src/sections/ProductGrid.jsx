import { defineComponent } from 'vue'
import ProductCard from '@/components/ProductCard.jsx'

export default defineComponent({
  name: 'ProductGrid',
  props: { products: { type: Array, default: () => [] }, loading: Boolean, skeletons: { type: Number, default: 4 } },
  setup(props) {
    return () => {
      if (props.loading) {
        return (
          <div class="product-grid" aria-busy="true">
            {Array.from({ length: props.skeletons }, (_, i) => <div key={i} class="card skeleton-card"><div class="skeleton skeleton--media" /><div class="skeleton skeleton--line" /><div class="skeleton skeleton--line short" /></div>)}
          </div>
        )
      }
      if (!props.products.length) return <p class="empty">Pronto publicaremos nuestros productos.</p>
      return <div class="product-grid">{props.products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
    }
  },
})
