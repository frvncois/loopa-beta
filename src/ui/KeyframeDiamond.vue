<script setup lang="ts">
defineProps<{
  hasTrack: boolean
  active: boolean   // keyframe exists at current frame
}>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="w-[14px] h-[14px] flex-shrink-0 flex items-center justify-center rounded-[2px] transition-colors duration-[140ms]"
    :class="active ? 'text-warning' : hasTrack ? 'text-text-3 hover:text-text-1' : 'text-text-4 hover:text-text-2'"
    :title="active ? 'Delete keyframe' : hasTrack ? 'Add keyframe here' : 'Create animation track'"
    @click.stop="$emit('toggle')"
  >
    <!-- Hollow diamond: no keyframe at current frame -->
    <svg v-if="!active" width="7" height="7" viewBox="0 0 7 7" fill="none">
      <rect x="0.7" y="0.7" width="5.6" height="5.6" rx="0.5" transform="rotate(45 3.5 3.5)" stroke="currentColor" stroke-width="1.1" />
    </svg>
    <!-- Solid diamond: keyframe exists at current frame -->
    <svg v-else width="7" height="7" viewBox="0 0 7 7" fill="currentColor">
      <rect x="0.7" y="0.7" width="5.6" height="5.6" rx="0.5" transform="rotate(45 3.5 3.5)" />
    </svg>
  </button>
</template>
