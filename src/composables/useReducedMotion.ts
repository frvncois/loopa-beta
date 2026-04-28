import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useReducedMotion() {
  const reduced = ref(false)
  let mq: MediaQueryList | null = null

  function onChange(e: MediaQueryListEvent): void {
    reduced.value = e.matches
  }

  onMounted(() => {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = mq.matches
    mq.addEventListener('change', onChange)
  })

  onBeforeUnmount(() => {
    mq?.removeEventListener('change', onChange)
  })

  return { reduced }
}
