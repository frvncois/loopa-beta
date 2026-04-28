<script setup lang="ts">
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSaveOrchestrator } from '@/composables/useSaveOrchestrator'
import Button from '@/ui/Button.vue'

const doc        = useDocumentStore()
const { saveNow } = useSaveOrchestrator()
</script>

<template>
  <Button
    v-if="doc.location === 'local' && doc.isDirty"
    variant="accent"
    size="sm"
    @click="saveNow()"
  >
    Save
  </Button>
</template>
