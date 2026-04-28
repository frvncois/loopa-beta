import { ref } from 'vue'

export interface MarqueeRect {
  x: number
  y: number
  width: number
  height: number
}

const _marquee = ref<MarqueeRect | null>(null)

export function useMarquee() {
  return {
    marquee: _marquee as Readonly<typeof _marquee>,
    set(r: MarqueeRect | null): void {
      _marquee.value = r
    },
    clear(): void {
      _marquee.value = null
    },
  }
}
