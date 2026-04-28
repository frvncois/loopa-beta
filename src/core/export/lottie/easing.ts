import type { EasingType } from '@/types/track'

export interface LottieEasingHandles {
  o: { x: number[]; y: number[] }
  i: { x: number[]; y: number[] }
}

/** Easings that cannot be represented as a bezier — must bake per-frame */
export function needsBaking(easing: EasingType | string): boolean {
  return (
    easing === 'ease-out-bounce' ||
    easing === 'ease-out-elastic' ||
    (easing as string).startsWith('steps(')
  )
}

const TABLE: Record<string, LottieEasingHandles> = {
  linear:              { o: { x: [1],    y: [1]     }, i: { x: [0],    y: [0]    } },
  'ease-in':           { o: { x: [0.42], y: [0]     }, i: { x: [1],    y: [1]    } },
  'ease-out':          { o: { x: [0],    y: [0]     }, i: { x: [0.58], y: [1]    } },
  'ease-in-out':       { o: { x: [0.42], y: [0]     }, i: { x: [0.58], y: [1]    } },
  'ease-in-cubic':     { o: { x: [0.32], y: [0]     }, i: { x: [0.67], y: [0]    } },
  'ease-out-cubic':    { o: { x: [0.33], y: [1]     }, i: { x: [0.68], y: [1]    } },
  'ease-in-out-cubic': { o: { x: [0.65], y: [0]     }, i: { x: [0.35], y: [1]    } },
  'ease-in-back':      { o: { x: [0.36], y: [0]     }, i: { x: [0.66], y: [-0.56] } },
  'ease-out-back':     { o: { x: [0.34], y: [1.56]  }, i: { x: [0.64], y: [1]    } },
  'ease-in-out-back':  { o: { x: [0.68], y: [-0.6]  }, i: { x: [0.32], y: [1.6]  } },
}

const LINEAR: LottieEasingHandles = TABLE['linear']!

/**
 * Returns Lottie bezier handles for a given easing, or null if it must be baked.
 * Both `o` and `i` live on the SAME keyframe and together define the segment to the next one.
 */
export function lottieEasingHandles(easing: EasingType | string): LottieEasingHandles | null {
  if (needsBaking(easing)) return null

  const t = TABLE[easing]
  if (t !== undefined) return t

  const m = /^cubic-bezier\(([\d.-]+),([\d.-]+),([\d.-]+),([\d.-]+)\)$/.exec(easing)
  if (m) {
    return {
      o: { x: [Number(m[1])], y: [Number(m[2])] },
      i: { x: [Number(m[3])], y: [Number(m[4])] },
    }
  }

  return LINEAR
}
