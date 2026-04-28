<script setup lang="ts">
import type {
  ExportFormat, ExportOptions,
  LottieOptions as LottieOpts,
  PngSequenceOptions as PngOpts,
  GifOptions as GifOpts,
  Mp4Options as Mp4Opts,
  WebmOptions as WebmOpts,
} from '@/types/export'
import LottieOptions from './options/LottieOptions.vue'
import PngOptions    from './options/PngOptions.vue'
import GifOptions    from './options/GifOptions.vue'
import Mp4Options    from './options/Mp4Options.vue'
import WebmOptions   from './options/WebmOptions.vue'

const props = defineProps<{
  format: ExportFormat
  options: ExportOptions
}>()

const emit = defineEmits<{
  'update:format':  [ExportFormat]
  'update:options': [ExportOptions]
}>()

const formats: { id: ExportFormat; label: string }[] = [
  { id: 'lottie',       label: 'Lottie' },
  { id: 'png-sequence', label: 'PNG Seq' },
  { id: 'gif',          label: 'GIF' },
  { id: 'mp4',          label: 'MP4' },
  { id: 'webm',         label: 'WebM' },
]
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Format pills -->
    <div class="flex gap-1.5">
      <button
        v-for="fmt in formats"
        :key="fmt.id"
        :data-active="format === fmt.id"
        class="px-3 h-input-sm text-xs border border-border rounded-sm transition-colors duration-[140ms]
               hover:border-border-l data-[active=true]:bg-accent-soft
               data-[active=true]:text-accent data-[active=true]:border-accent
               text-text-2"
        @click="emit('update:format', fmt.id)"
      >
        {{ fmt.label }}
      </button>
    </div>

    <!-- Per-format options -->
    <div class="border-t border-border pt-3">
      <LottieOptions
        v-if="format === 'lottie'"
        :options="options as LottieOpts"
        @update:options="emit('update:options', $event)"
      />
      <PngOptions
        v-else-if="format === 'png-sequence'"
        :options="options as PngOpts"
        @update:options="emit('update:options', $event)"
      />
      <GifOptions
        v-else-if="format === 'gif'"
        :options="options as GifOpts"
        @update:options="emit('update:options', $event)"
      />
      <Mp4Options
        v-else-if="format === 'mp4'"
        :options="options as Mp4Opts"
        @update:options="emit('update:options', $event)"
      />
      <WebmOptions
        v-else-if="format === 'webm'"
        :options="options as WebmOpts"
        @update:options="emit('update:options', $event)"
      />
    </div>
  </div>
</template>
