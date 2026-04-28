<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/core/utils/cn'

const {
  variant = 'default',
  size = 'md',
  active = false,
  disabled = false,
} = defineProps<{
  variant?: 'default' | 'accent' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md'
  active?: boolean
  disabled?: boolean
}>()

const classes = computed(() =>
  cn(
    'inline-flex items-center justify-center border rounded-sm transition-colors duration-[140ms] select-none flex-shrink-0',
    size === 'sm' && 'h-[1.5rem] w-[1.5rem]',
    size === 'xs' && 'h-[1.25rem] w-[1.25rem]',
    size === 'md' && 'h-input w-input',
    active && 'bg-accent-soft text-accent border-accent',
    !active && variant === 'default' && 'bg-bg-3 text-text-2 border-border hover:bg-bg-5 hover:text-text-1 hover:border-border-l',
    !active && variant === 'accent' && 'bg-accent text-white border-accent hover:bg-accent-h',
    !active && variant === 'ghost' && 'border-transparent bg-transparent text-text-2 hover:bg-bg-4 hover:border-transparent',
    !active && variant === 'danger' && 'bg-bg-3 border-border text-danger hover:bg-danger-soft hover:border-danger',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ),
)
</script>

<template>
  <button :class="classes" :disabled="disabled">
    <slot />
  </button>
</template>
