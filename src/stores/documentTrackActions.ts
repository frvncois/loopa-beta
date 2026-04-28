import type { Ref } from 'vue'
import type { Track, Keyframe, KeyframeValue, EasingType, PropertyPath } from '@/types/track'
import { generateId } from '@/core/utils/id'

export function createTrackActions(
  tracks: Ref<Track[]>,
  trackForProperty: (elementId: string, property: PropertyPath) => Track | undefined,
) {
  function addTrack(track: Track): void {
    if (trackForProperty(track.elementId, track.property)) return
    tracks.value.push(track)
  }

  function upsertKeyframe(
    elementId: string,
    property: PropertyPath,
    frame: number,
    value: KeyframeValue,
    easing: EasingType = 'linear',
  ): void {
    if (!trackForProperty(elementId, property)) {
      tracks.value.push({
        id: generateId('track'),
        elementId,
        property,
        keyframes: [],
        enabled: true,
      })
    }
    const track = trackForProperty(elementId, property)
    if (!track) return

    const existingIdx = track.keyframes.findIndex((kf) => kf.frame === frame)
    if (existingIdx !== -1) {
      const kf = track.keyframes[existingIdx]
      if (kf !== undefined) { kf.value = value; kf.easing = easing }
      return
    }

    const newKf: Keyframe = { id: generateId('kf'), frame, value, easing }
    const insertIdx = track.keyframes.findIndex((kf) => kf.frame > frame)
    if (insertIdx === -1) track.keyframes.push(newKf)
    else track.keyframes.splice(insertIdx, 0, newKf)
  }

  function deleteKeyframe(trackId: string, keyframeId: string): void {
    const track = tracks.value.find((t) => t.id === trackId)
    if (!track) return
    track.keyframes = track.keyframes.filter((kf) => kf.id !== keyframeId)
    if (track.keyframes.length === 0) {
      tracks.value = tracks.value.filter((t) => t.id !== trackId)
    }
  }

  function deleteTracksForElement(elementId: string): void {
    tracks.value = tracks.value.filter((t) => t.elementId !== elementId)
  }

  function setTrackEnabled(trackId: string, enabled: boolean): void {
    const track = tracks.value.find((t) => t.id === trackId)
    if (track) track.enabled = enabled
  }

  return { addTrack, upsertKeyframe, deleteKeyframe, deleteTracksForElement, setTrackEnabled }
}
