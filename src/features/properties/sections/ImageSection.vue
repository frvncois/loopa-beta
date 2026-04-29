<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { IDBMediaRepo } from '@/core/persistence/IDBMediaRepo'
import { generateId } from '@/core/utils/id'
import type { ImageElement } from '@/types/element'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import Select from '@/ui/Select.vue'
import Button from '@/ui/Button.vue'

const props = defineProps<{ elementId: string }>()

const doc     = useDocumentStore()
const history = useHistoryStore()
const mediaRepo = new IDBMediaRepo()

const element = computed(() => doc.elementById(props.elementId) as ImageElement | undefined)

const FIT_OPTIONS = [
  { value: 'contain', label: 'Contain' },
  { value: 'cover',   label: 'Cover' },
  { value: 'fill',    label: 'Fill' },
]

const objectFit = computed({
  get: () => element.value?.objectFit ?? 'contain',
  set: (v: string) => {
    history.transact('Image fit', () => {
      doc.updateElement(props.elementId, { objectFit: v as ImageElement['objectFit'] })
    })
  },
})

const fileInputRef = ref<HTMLInputElement | null>(null)

function openReplace(): void {
  fileInputRef.value?.click()
}

async function onReplaceFile(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !element.value) return

  const storageId = generateId('media')
  await mediaRepo.put(storageId, file)

  const img = new Image()
  const u = URL.createObjectURL(file)
  await new Promise<void>((resolve, reject) => {
    img.onload  = () => { URL.revokeObjectURL(u); resolve() }
    img.onerror = () => { URL.revokeObjectURL(u); reject() }
    img.src = u
  })

  history.transact('Replace image', () => {
    doc.updateElement(props.elementId, {
      imageStorageId: storageId,
      imageFileName:  file.name,
      imageWidth:     img.naturalWidth,
      imageHeight:    img.naturalHeight,
    })
  })

  // Reset so same file can be selected again
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>

<template>
  <CollapsibleSection v-if="element" title="Image" :default-open="true">
    <Row>
      <Label>File</Label>
      <span class="flex-1 text-xs text-text-2 truncate" :title="element.imageFileName">
        {{ element.imageFileName }}
      </span>
    </Row>
    <Row>
      <Label>Fit</Label>
      <Select v-model="objectFit" :options="FIT_OPTIONS" />
    </Row>
    <Row>
      <Button variant="default" size="sm" @click="openReplace">Replace image</Button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onReplaceFile"
      />
    </Row>
  </CollapsibleSection>
</template>
