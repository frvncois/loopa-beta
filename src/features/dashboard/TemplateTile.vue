<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { RemoteProjectRepo } from '@/core/persistence/RemoteProjectRepo'
import type { TemplateDefinition } from '@/core/templates/index'

const props  = defineProps<{ template: TemplateDefinition }>()
const router  = useRouter()
const repo    = new RemoteProjectRepo()
const working = ref(false)
const errorMsg = ref('')

async function createFromTemplate(): Promise<void> {
  if (working.value) return
  working.value  = true
  errorMsg.value = ''
  try {
    const project = await repo.create(props.template.name, props.template.data)
    await router.push(`/app/${project.meta.slug}`)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to create project'
    working.value  = false
  }
}
</script>

<template>
  <button
    type="button"
    class="group flex flex-col items-start gap-2 text-left cursor-pointer disabled:cursor-not-allowed"
    :disabled="working"
    @click="createFromTemplate"
  >
    <!-- Static preview -->
    <div class="w-full aspect-[4/3] bg-bg-2 border border-border group-hover:border-border-l rounded-md overflow-hidden flex items-center justify-center transition-colors duration-[140ms]">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="w-12 h-12 text-text-1" v-html="template.previewSvg" />
    </div>

    <div class="w-full">
      <p class="text-xs font-medium text-text-2 group-hover:text-text-1 transition-colors duration-[140ms] truncate">
        {{ template.name }}
      </p>
      <p class="text-[10px] text-text-4 truncate mt-0.5">{{ template.description }}</p>
      <p v-if="errorMsg" class="text-[10px] text-danger mt-0.5">{{ errorMsg }}</p>
    </div>
  </button>
</template>
