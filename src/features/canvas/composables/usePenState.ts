import { ref } from 'vue'

// World-space in-progress point (not yet committed to an element)
export interface InProgressPoint {
  x: number
  y: number
  handleIn:  { x: number; y: number } | null
  handleOut: { x: number; y: number } | null
}

interface PenState {
  active: boolean
  points: InProgressPoint[]
  cursor: { x: number; y: number } | null
}

const _state = ref<PenState>({ active: false, points: [], cursor: null })

export function usePenState() {
  return {
    state: _state as Readonly<typeof _state>,

    setActive(v: boolean):                              void { _state.value.active = v },
    setPoints(pts: InProgressPoint[]):                  void { _state.value.points = pts },
    setCursor(pos: { x: number; y: number } | null):   void { _state.value.cursor = pos },

    reset(): void {
      _state.value = { active: false, points: [], cursor: null }
    },
  }
}
