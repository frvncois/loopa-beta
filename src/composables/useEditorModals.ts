import { ref } from 'vue'

const _showShortcuts = ref(false)
const _showSettings  = ref(false)

export function useEditorModals() {
  return {
    showShortcuts: _showShortcuts,
    showSettings:  _showSettings,
  }
}
