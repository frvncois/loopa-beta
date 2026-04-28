import { ref } from 'vue'

interface PendingConfirm {
  onConfirm: () => void
  onCancel:  () => void
}

const _pending = ref<PendingConfirm | null>(null)
const _isOpen  = ref(false)

export function useMotionPathConfirm() {
  return {
    isOpen: _isOpen as Readonly<typeof _isOpen>,

    requestConfirm(onConfirm: () => void, onCancel: () => void): void {
      _pending.value = { onConfirm, onCancel }
      _isOpen.value  = true
    },

    confirm(): void {
      const p = _pending.value
      _pending.value = null
      _isOpen.value  = false
      p?.onConfirm()
    },

    cancel(): void {
      const p = _pending.value
      _pending.value = null
      _isOpen.value  = false
      p?.onCancel()
    },
  }
}
