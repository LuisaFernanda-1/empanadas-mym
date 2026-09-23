// "Quiénes somos": imagen, historia, misión y visión
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.jsx'
import { store } from '@/store/site.js'

export default defineComponent({
  name: 'AboutBlock',
  props: { summary: Boolean },   // en el inicio se muestra solo el primer párrafo
  setup(props) {
    return () => {
      const a = store.site.about
      const paragraphs = props.summary ? a.paragraphs.slice(0, 1) : a.paragraphs
      return (
        <div class="about">
          {a.image && (
            <div class="about__media">
              <img src={a.image} alt={`${store.site.name}`} loading="lazy" />
            </div>
          )}
          <div class="about__body">
            <p class="eyebrow">Quiénes somos</p>
            <h2>{a.title}</h2>
            {paragraphs.map((t, i) => <p key={i} class="about__text">{t}</p>)}
            {!props.summary && (a.mission || a.vision) && (
              <div class="about__mv">
                {a.mission && (
                  <div class="mv">
                    <span class="mv__icon"><Icon name="target" size={22} /></span>
                    <div><h3>Misión</h3><p>{a.mission}</p></div>
                  </div>
                )}
                {a.vision && (
                  <div class="mv">
                    <span class="mv__icon"><Icon name="eye" size={22} /></span>
                    <div><h3>Visión</h3><p>{a.vision}</p></div>
                  </div>
                )}
              </div>
            )}
            {props.summary && (
              <RouterLink to="/quienes-somos" class="btn btn--outline">Conoce nuestra historia <Icon name="arrow-right" size={18} /></RouterLink>
            )}
          </div>
        </div>
      )
    }
  },
})
