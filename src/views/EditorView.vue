<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentStore } from '@/stores/useDocumentStore'
import EditorShell from '@/layout/EditorShell.vue'
import UpgradeModal from '@/features/upgrade/UpgradeModal.vue'
import WelcomeModal from '@/features/onboarding/WelcomeModal.vue'

const route = useRoute()
const doc   = useDocumentStore()

async function initDocument(slug?: string | string[]): Promise<void> {
  const s = Array.isArray(slug) ? slug[0] : slug
  if (s) {
    await doc.loadFromCloud(s)
  } else {
    doc.initLocal()
  }
}

onMounted(() => void initDocument(route.params.slug))
watch(() => route.params.slug, (slug) => void initDocument(slug))
onUnmounted(() => doc.clearProject())
</script>

<template>
  <EditorShell />
  <UpgradeModal />
  <WelcomeModal v-if="!route.params.slug" />
</template>
