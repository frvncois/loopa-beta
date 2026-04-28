<script setup lang="ts">
import { ref } from 'vue'

import Button from '@/ui/Button.vue'
import IconButton from '@/ui/IconButton.vue'
import Divider from '@/ui/Divider.vue'
import NumberField from '@/ui/NumberField.vue'
import TextField from '@/ui/TextField.vue'
import Select from '@/ui/Select.vue'
import ColorField from '@/ui/ColorField.vue'
import Toggle from '@/ui/Toggle.vue'
import Checkbox from '@/ui/Checkbox.vue'
import Slider from '@/ui/Slider.vue'
import Modal from '@/ui/Modal.vue'
import PanelHeader from '@/ui/PanelHeader.vue'
import EmptyState from '@/ui/EmptyState.vue'

import Section from '@/ui/inspector/Section.vue'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import PairedField from '@/ui/inspector/PairedField.vue'

import {
  IconSelect, IconHand, IconRect, IconEllipse, IconLine, IconPolygon,
  IconStar, IconText, IconPen, IconPlay, IconPause, IconStop, IconUndo,
  IconRedo, IconEye, IconEyeOff, IconLock, IconTrash, IconPlus, IconMinus,
  IconX, IconCheck, IconChevronDown, IconChevronRight, IconSettings, IconGrid,
  IconRuler, IconGroup, IconMotionPath, IconDuplicate, IconKeyframe, IconImage,
  IconVideo, IconFlipH, IconFlipV, IconSearch, IconComponent,
} from '@/ui/icons'

// ── State ──────────────────────────────────────────────────────────────────
const numVal = ref(42)
const numPaired1 = ref(100)
const numPaired2 = ref(200)
const textVal = ref('')
const selectVal = ref('linear')
const colorVal = ref('4353ff')
const toggleOn = ref(true)
const toggleOff = ref(false)
const checkOn = ref(true)
const checkOff = ref(false)
const sliderVal = ref(60)
const showModal = ref(false)

const selectOptions = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In/Out' },
]

const inspX = ref(120)
const inspY = ref(240)
const inspW = ref(400)
const inspH = ref(300)
const inspOpacity = ref(100)
const inspBlend = ref('normal')

const blendOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
]

const ICONS = [
  { name: 'IconSelect', component: IconSelect },
  { name: 'IconHand', component: IconHand },
  { name: 'IconRect', component: IconRect },
  { name: 'IconEllipse', component: IconEllipse },
  { name: 'IconLine', component: IconLine },
  { name: 'IconPolygon', component: IconPolygon },
  { name: 'IconStar', component: IconStar },
  { name: 'IconText', component: IconText },
  { name: 'IconPen', component: IconPen },
  { name: 'IconPlay', component: IconPlay },
  { name: 'IconPause', component: IconPause },
  { name: 'IconStop', component: IconStop },
  { name: 'IconUndo', component: IconUndo },
  { name: 'IconRedo', component: IconRedo },
  { name: 'IconEye', component: IconEye },
  { name: 'IconEyeOff', component: IconEyeOff },
  { name: 'IconLock', component: IconLock },
  { name: 'IconTrash', component: IconTrash },
  { name: 'IconPlus', component: IconPlus },
  { name: 'IconMinus', component: IconMinus },
  { name: 'IconX', component: IconX },
  { name: 'IconCheck', component: IconCheck },
  { name: 'IconChevronDown', component: IconChevronDown },
  { name: 'IconChevronRight', component: IconChevronRight },
  { name: 'IconSettings', component: IconSettings },
  { name: 'IconGrid', component: IconGrid },
  { name: 'IconRuler', component: IconRuler },
  { name: 'IconGroup', component: IconGroup },
  { name: 'IconMotionPath', component: IconMotionPath },
  { name: 'IconDuplicate', component: IconDuplicate },
  { name: 'IconKeyframe', component: IconKeyframe },
  { name: 'IconImage', component: IconImage },
  { name: 'IconVideo', component: IconVideo },
  { name: 'IconFlipH', component: IconFlipH },
  { name: 'IconFlipV', component: IconFlipV },
  { name: 'IconSearch', component: IconSearch },
  { name: 'IconComponent', component: IconComponent },
]
</script>

<template>
  <div class="min-h-screen bg-bg-0 text-text-1 font-sans overflow-y-auto">
    <!-- Top bar -->
    <div class="sticky top-0 z-10 h-topbar bg-bg-1 border-b border-border flex items-center px-6 gap-4">
      <span class="text-xs font-semibold text-accent uppercase tracking-wider">/_dev</span>
      <span class="text-xs text-text-4">UI primitive gallery — Phase 4</span>
    </div>

    <div class="max-w-[900px] mx-auto px-6 py-8 flex flex-col gap-10">

      <!-- ── BUTTONS ─────────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 mb-4">Button</h2>
        <div class="flex flex-col gap-3">
          <!-- variants × md -->
          <div class="flex items-center gap-2">
            <Button>Default</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button :active="true">Active</Button>
            <Button :disabled="true">Disabled</Button>
          </div>
          <!-- sizes -->
          <div class="flex items-center gap-2">
            <Button size="md">md</Button>
            <Button size="sm">sm</Button>
            <Button size="xs">xs</Button>
          </div>
          <!-- with icon -->
          <div class="flex items-center gap-2">
            <Button><IconPlus />Add Layer</Button>
            <Button variant="accent"><IconPlay />Play</Button>
            <Button variant="ghost"><IconSettings />Settings</Button>
          </div>
        </div>
      </section>

      <!-- ── ICON BUTTON ─────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 mb-4">IconButton</h2>
        <div class="flex items-center gap-2">
          <IconButton><IconPlus /></IconButton>
          <IconButton variant="accent"><IconPlay /></IconButton>
          <IconButton variant="ghost"><IconSettings /></IconButton>
          <IconButton variant="danger"><IconTrash /></IconButton>
          <IconButton :active="true"><IconGrid /></IconButton>
          <IconButton :disabled="true"><IconLock /></IconButton>
          <IconButton size="sm"><IconMinus /></IconButton>
          <IconButton size="xs"><IconX /></IconButton>
        </div>
      </section>

      <!-- ── DIVIDER ─────────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 mb-4">Divider</h2>
        <div class="flex flex-col gap-2 w-48">
          <Divider />
          <span class="text-xs text-text-4">horizontal</span>
          <div class="flex items-center h-6 gap-2">
            <span class="text-xs text-text-4">A</span>
            <Divider :vertical="true" />
            <span class="text-xs text-text-4">B</span>
          </div>
        </div>
      </section>

      <!-- ── FIELDS ──────────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 mb-4">Fields</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <!-- NumberField -->
          <div class="flex items-center gap-2">
            <div class="w-20"><NumberField v-model="numVal" /></div>
            <div class="w-20"><NumberField v-model="numVal" :min="0" :max="100" unit="%" /></div>
            <div class="w-20"><NumberField v-model="numVal" :disabled="true" /></div>
          </div>
          <!-- Paired NumberFields -->
          <div class="flex items-center gap-1">
            <NumberField v-model="numPaired1" :paired="true" />
            <NumberField v-model="numPaired2" :paired="true" />
          </div>
          <!-- TextField -->
          <TextField v-model="textVal" placeholder="Layer name…" />
          <TextField v-model="textVal" :disabled="true" placeholder="Disabled" />
          <!-- Select -->
          <Select v-model="selectVal" :options="selectOptions" />
          <Select v-model="selectVal" :options="selectOptions" :disabled="true" />
          <!-- ColorField -->
          <ColorField v-model:model-value="colorVal" />
        </div>
      </section>

      <!-- ── CONTROLS ────────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 mb-4">Controls</h2>
        <div class="flex flex-col gap-4 max-w-sm">
          <!-- Toggle -->
          <div class="flex items-center gap-4">
            <Toggle v-model="toggleOn" />
            <Toggle v-model="toggleOff" />
            <Toggle :model-value="true" :disabled="true" />
            <Toggle :model-value="false" :disabled="true" />
          </div>
          <!-- Checkbox -->
          <div class="flex items-center gap-4">
            <Checkbox v-model="checkOn" />
            <Checkbox v-model="checkOff" />
            <Checkbox :model-value="true" :disabled="true" />
            <Checkbox :model-value="false" :disabled="true" />
          </div>
          <!-- Slider -->
          <Slider v-model="sliderVal" :min="0" :max="100" />
          <Slider :model-value="50" :disabled="true" />
        </div>
      </section>

      <!-- ── INSPECTOR ───────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 mb-4">Inspector Primitives</h2>
        <div class="border border-border rounded-md overflow-hidden w-[240px]">
          <PanelHeader title="Properties" />

          <!-- Plain Section -->
          <Section title="Transform">
            <Row>
              <Label>X</Label>
              <NumberField v-model="inspX" />
            </Row>
            <Row>
              <Label>Y</Label>
              <NumberField v-model="inspY" />
            </Row>
            <Row>
              <Label>W × H</Label>
              <PairedField>
                <NumberField v-model="inspW" :paired="true" />
                <NumberField v-model="inspH" :paired="true" />
              </PairedField>
            </Row>
          </Section>

          <!-- CollapsibleSection open -->
          <CollapsibleSection title="Fill" :default-open="true">
            <Row>
              <Label>Color</Label>
              <ColorField v-model:model-value="colorVal" />
            </Row>
          </CollapsibleSection>

          <!-- CollapsibleSection with activity -->
          <CollapsibleSection title="Opacity" :default-open="true" :has-activity="true">
            <Row>
              <Label>Opacity</Label>
              <NumberField v-model="inspOpacity" :min="0" :max="100" unit="%" />
            </Row>
            <Row>
              <Label>Blend</Label>
              <Select v-model="inspBlend" :options="blendOptions" />
            </Row>
          </CollapsibleSection>

          <!-- CollapsibleSection closed by default -->
          <CollapsibleSection title="Shadow" :default-open="false">
            <Row>
              <Label>Offset X</Label>
              <NumberField v-model="inspX" />
            </Row>
          </CollapsibleSection>

          <!-- EmptyState inside panel -->
          <EmptyState message="No effects applied." />
        </div>
      </section>

      <!-- ── PANEL HEADER ────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 mb-4">PanelHeader</h2>
        <div class="border border-border rounded-md overflow-hidden w-[240px]">
          <PanelHeader title="Layers">
            <template #actions>
              <IconButton size="xs" variant="ghost"><IconPlus /></IconButton>
            </template>
          </PanelHeader>
          <div class="p-3">
            <EmptyState message="No layers yet." />
          </div>
        </div>
      </section>

      <!-- ── MODAL ───────────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 mb-4">Modal</h2>
        <Button @click="showModal = true">Open Modal</Button>
        <Modal :show="showModal" title="Rename Layer" @close="showModal = false">
          <div class="flex flex-col gap-3">
            <TextField v-model="textVal" placeholder="Layer name…" />
          </div>
          <template #footer>
            <Button @click="showModal = false">Cancel</Button>
            <Button variant="accent" @click="showModal = false">Rename</Button>
          </template>
        </Modal>
      </section>

      <!-- ── ICONS ───────────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 mb-4">Icons ({{ ICONS.length }})</h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1">
          <div
            v-for="icon in ICONS"
            :key="icon.name"
            class="flex flex-col items-center gap-1.5 p-2 rounded-sm bg-bg-2 border border-border hover:border-border-l transition-colors"
          >
            <component :is="icon.component" class="text-text-2" />
            <span class="text-[9px] text-text-4 text-center leading-tight truncate w-full text-center">
              {{ icon.name.replace('Icon', '') }}
            </span>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
