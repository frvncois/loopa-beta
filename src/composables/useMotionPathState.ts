import { ref } from 'vue'

// World-space in-progress point (same shape as usePenState.InProgressPoint)
export interface DrawPoint {
  x: number
  y: number
  handleIn:  { x: number; y: number } | null
  handleOut: { x: number; y: number } | null
}

export type MotionPathPhase = 'idle' | 'picking' | 'drawing'

interface MotionPathState {
  phase: MotionPathPhase
  followerElementId: string | null
  points: DrawPoint[]
  cursor: { x: number; y: number } | null
}

const _state = ref<MotionPathState>({
  phase: 'idle',
  followerElementId: null,
  points: [],
  cursor: null,
})

export function useMotionPathState() {
  return {
    state: _state as Readonly<typeof _state>,

    setPhase(phase: MotionPathPhase):                    void { _state.value.phase = phase },
    setFollower(id: string | null):                      void { _state.value.followerElementId = id },
    setPoints(pts: DrawPoint[]):                         void { _state.value.points = pts },
    setCursor(pos: { x: number; y: number } | null):    void { _state.value.cursor = pos },

    reset(): void {
      _state.value = { phase: 'idle', followerElementId: null, points: [], cursor: null }
    },
  }
}
