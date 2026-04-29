import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import type { Artboard } from '@/types/artboard'

export const useTimelineStore = defineStore('timeline', () => {
  const currentFrame = ref(0)
  const totalFrames = ref(60)
  const fps = ref(30)
  const isPlaying = ref(false)
  const loop = ref(true)
  const direction = ref<'normal' | 'reverse' | 'alternate' | 'alternate-reverse'>('normal')
  const playbackCompleteCount = ref(0)

  let _rafId: number | null = null
  let _startTime: number | null = null
  let _startFrame: number = 0

  const duration = computed(() => totalFrames.value / fps.value)

  const currentTime = computed(() => {
    const totalSeconds = currentFrame.value / fps.value
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const tenths = Math.floor((totalSeconds % 1) * 10)
    return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`
  })

  function tick(timestamp: number): void {
    if (!isPlaying.value) return

    if (_startTime === null) {
      _startTime = timestamp
      _startFrame = currentFrame.value
    }

    const rawFrames = (timestamp - _startTime) * fps.value / 1000
    const totalF = totalFrames.value
    const dir = direction.value
    let next: number

    if (dir === 'reverse') {
      const raw = _startFrame - rawFrames
      if (!loop.value && raw <= 0) {
        currentFrame.value = 0; isPlaying.value = false; _rafId = null; _startTime = null; return
      }
      next = loop.value ? ((raw % totalF) + totalF) % totalF : Math.max(raw, 0)
    } else if (dir === 'alternate') {
      const total = rawFrames
      const cycle = Math.floor(total / totalF)
      const pos = total % totalF
      next = cycle % 2 === 0 ? pos : totalF - pos
      if (cycle > playbackCompleteCount.value) playbackCompleteCount.value = cycle
      if (!loop.value && cycle >= 2) {
        currentFrame.value = 0; isPlaying.value = false; _rafId = null; _startTime = null; return
      }
    } else if (dir === 'alternate-reverse') {
      const total = rawFrames
      const cycle = Math.floor(total / totalF)
      const pos = total % totalF
      next = cycle % 2 === 0 ? totalF - pos : pos
      if (cycle > playbackCompleteCount.value) playbackCompleteCount.value = cycle
      if (!loop.value && cycle >= 2) {
        currentFrame.value = 0; isPlaying.value = false; _rafId = null; _startTime = null; return
      }
    } else {
      // normal
      const raw = _startFrame + rawFrames
      const cycles = Math.floor(raw / totalF)
      if (!loop.value && raw >= totalF) {
        currentFrame.value = totalF; isPlaying.value = false; _rafId = null; _startTime = null; return
      }
      if (cycles > playbackCompleteCount.value) playbackCompleteCount.value = cycles
      next = loop.value ? raw % totalF : Math.min(raw, totalF)
    }

    currentFrame.value = next
    _rafId = requestAnimationFrame(tick)
  }

  function play(): void {
    if (isPlaying.value) return
    if (direction.value === 'normal' && currentFrame.value >= totalFrames.value) currentFrame.value = 0
    if (direction.value === 'reverse' && currentFrame.value <= 0) currentFrame.value = totalFrames.value
    isPlaying.value = true
    _startTime = null
    _rafId = requestAnimationFrame(tick)
  }

  function pause(): void {
    isPlaying.value = false
    if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }
    _startTime = null
  }

  function stop(): void { pause(); currentFrame.value = 0 }
  function toggle(): void { if (isPlaying.value) pause(); else play() }

  function seek(frame: number): void {
    currentFrame.value = Math.max(0, Math.min(totalFrames.value, frame))
  }

  function nextFrame(): void { seek(Math.floor(currentFrame.value) + 1) }
  function prevFrame(): void { seek(Math.floor(currentFrame.value) - 1) }
  function setFps(f: number): void { fps.value = f }
  function setTotalFrames(n: number): void { totalFrames.value = n }
  function setLoop(b: boolean): void { loop.value = b }
  function setDirection(d: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'): void { direction.value = d }

  function syncFromArtboard(artboard: Artboard): void {
    fps.value = artboard.fps
    totalFrames.value = artboard.totalFrames
    loop.value = artboard.loop
    direction.value = artboard.direction
  }

  function reset(): void {
    pause()
    _startTime  = null
    _startFrame = 0
    currentFrame.value          = 0
    totalFrames.value           = 60
    fps.value                   = 30
    loop.value                  = true
    direction.value             = 'normal'
    playbackCompleteCount.value = 0
  }

  return {
    currentFrame, totalFrames, fps, isPlaying, loop, direction,
    playbackCompleteCount, duration, currentTime,
    play, pause, stop, toggle, seek, nextFrame, prevFrame,
    setFps, setTotalFrames, setLoop, setDirection, syncFromArtboard, reset,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useTimelineStore, import.meta.hot))
