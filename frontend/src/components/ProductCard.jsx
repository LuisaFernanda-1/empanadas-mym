import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from './Icon.jsx'
import { store } from '@/store/site.js'
import { formatPrice, whatsappLink, productMessage } from '@/utils/format.js'

export default defineComponent({
  name: 'ProductCard',
  props: { product: { type: Object, required: true } },
  setup(props) {
    return () => {
      const p = props.product
      const order = whatsappLink(store.site.contact.whatsapp, productMessage(p, 1, store.site.name))
      return (
        <article class="card product-card">
          <RouterLink to={`/productos/${p.id}`} class="product-card__media" aria-label={`Ver ${p.name}`}>
            {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <div class="img-placeholder"><Icon name="image" size={32} /></div>}
          </RouterLink>
          <div class="product-card__body">
            <h3 class="product-card__name">
              <RouterLink to={`/productos/${p.id}`}>{p.name}</RouterLink>
            </h3>
            {p.description && <p class="product-card__desc">{p.description}</p>}
            <div class="product-card__foot">
              <span class={['price', { 'price--ask': p.price == null }]}>{formatPrice(p.price)}</span>
              <a href={order} target="_blank" rel="noopener" class="icon-btn icon-btn--primary" aria-label={`Pedir ${p.name} por WhatsApp`} title="Pedir por WhatsApp">
                <Icon name="cart" size={18} />
              </a>
            </div>
          </div>
        </article>
      )
    }
  },
})
