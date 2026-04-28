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
    'inline-flex items-center justify-center gap-1 border rounded-sm text-xs font-medium whitespace-nowrap transition-colors duration-[140ms] select-none',
    size === 'sm' && 'h-[1.5rem] px-[7px]',
    size === 'xs' && 'h-[1.25rem] px-[5px]',
    size === 'md' && 'h-input px-2',
    // active overrides variant colours
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
