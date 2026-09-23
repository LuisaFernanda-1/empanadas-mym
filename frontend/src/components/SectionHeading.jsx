import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SectionHeading',
  props: { eyebrow: String, title: String, center: Boolean },
  setup(props, { slots }) {
    return () => (
      <div class={['section-heading', { 'section-heading--center': props.center }]}>
        <div>
          {props.eyebrow && <p class="eyebrow">{props.eyebrow}</p>}
          <h2>{props.title}</h2>
        </div>
        {slots.default?.()}
      </div>
    )
  },
})
