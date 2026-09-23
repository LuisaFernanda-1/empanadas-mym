import { defineComponent } from 'vue'
import Icon from '@/components/Icon.jsx'

export default defineComponent({
  name: 'ConfirmDialog',
  props: { title: String, message: String, confirmText: { type: String, default: 'Confirmar' }, busy: Boolean },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    return () => (
      <div class="modal" role="alertdialog" aria-modal="true" onMousedown={(e) => e.target === e.currentTarget && emit('cancel')}>
        <div class="modal__card modal__card--sm">
          <div class="confirm">
            <span class="confirm__icon"><Icon name="trash" size={24} /></span>
            <h2>{props.title}</h2>
            <p>{props.message}</p>
          </div>
          <footer class="modal__foot">
            <button class="btn btn--ghost" onClick={() => emit('cancel')} disabled={props.busy}>Cancelar</button>
            <button class="btn btn--danger" onClick={() => emit('confirm')} disabled={props.busy}>{props.busy ? 'Eliminando…' : props.confirmText}</button>
          </footer>
        </div>
      </div>
    )
  },
})
