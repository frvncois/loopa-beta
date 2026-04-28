<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAccount } from '@/composables/useAccount'
import Button from '@/ui/Button.vue'

const auth = useAuthStore()
const { updateDisplayName, updateAvatar, changeEmail } = useAccount()

// ── Display name ─────────────────────────────────────────────────────────────

const nameInput  = ref(auth.profile?.displayName ?? '')
const nameSaving = ref(false)
const nameError  = ref('')
const nameOk     = ref(false)
const nameDirty  = computed(() => nameInput.value.trim() !== (auth.profile?.displayName ?? ''))

async function saveName(): Promise<void> {
  nameSaving.value = true
  nameError.value  = ''
  nameOk.value     = false
  const result = await updateDisplayName(nameInput.value)
  nameSaving.value = false
  if (result.ok) { nameOk.value = true; setTimeout(() => { nameOk.value = false }, 2000) }
  else nameError.value = result.error ?? 'Failed to save'
}

// ── Avatar ────────────────────────────────────────────────────────────────────

const avatarInput   = ref<HTMLInputElement | null>(null)
const avatarSaving  = ref(false)
const avatarError   = ref('')

const initials = computed(() => {
  const name = auth.profile?.displayName ?? auth.user?.email ?? '?'
  return name.slice(0, 2).toUpperCase()
})

async function onAvatarChange(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarSaving.value = true
  avatarError.value  = ''
  const result = await updateAvatar(file)
  avatarSaving.value = false
  if (!result.ok) avatarError.value = result.error ?? 'Upload failed'
}

// ── Email change ──────────────────────────────────────────────────────────────

const showEmailForm  = ref(false)
const emailInput     = ref('')
const emailSending   = ref(false)
const emailError     = ref('')
const emailSent      = ref(false)

async function sendEmailChange(): Promise<void> {
  emailSending.value = true
  emailError.value   = ''
  const result = await changeEmail(emailInput.value.trim())
  emailSending.value = false
  if (result.ok) { emailSent.value = true }
  else emailError.value = result.error ?? 'Failed to send'
}
</script>

<template>
  <div class="bg-bg-1 border border-border rounded-lg overflow-hidden">
    <div class="px-5 py-3.5 border-b border-border">
      <h2 class="text-sm font-semibold text-text-1">Profile</h2>
    </div>

    <div class="px-5 py-4 flex flex-col gap-5">

      <!-- Avatar -->
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-full bg-accent-soft text-accent text-sm font-bold flex items-center justify-center flex-shrink-0 overflow-hidden select-none"
        >
          <img
            v-if="auth.profile?.avatarUrl"
            :src="auth.profile.avatarUrl"
            alt="Avatar"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ initials }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <Button size="sm" variant="default" :disabled="avatarSaving" @click="avatarInput?.click()">
            {{ avatarSaving ? 'Uploading\u2026' : 'Upload avatar' }}
          </Button>
          <p v-if="avatarError" class="text-[10px] text-danger">{{ avatarError }}</p>
        </div>
        <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
      </div>

      <!-- Display name -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[11px] text-text-3 font-medium">Display name</label>
        <div class="flex items-center gap-2">
          <input
            v-model="nameInput"
            type="text"
            placeholder="Your name"
            class="flex-1 h-input bg-bg-3 border border-border rounded-sm px-[7px] text-xs text-text-1 font-sans outline-none transition-colors duration-[140ms] focus:border-accent placeholder:text-text-4"
            @keydown.enter="nameDirty && saveName()"
          />
          <Button
            size="sm"
            variant="default"
            :disabled="!nameDirty || nameSaving"
            @click="saveName"
          >
            {{ nameSaving ? 'Saving\u2026' : nameOk ? 'Saved' : 'Save' }}
          </Button>
        </div>
        <p v-if="nameError" class="text-[10px] text-danger">{{ nameError }}</p>
      </div>

      <!-- Email -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[11px] text-text-3 font-medium">Email</label>
        <div v-if="!showEmailForm" class="flex items-center gap-2">
          <input
            :value="auth.user?.email"
            type="email"
            readonly
            class="flex-1 h-input bg-bg-2 border border-border rounded-sm px-[7px] text-xs text-text-3 font-sans outline-none cursor-default"
          />
          <Button size="sm" variant="default" @click="showEmailForm = true">Change</Button>
        </div>
        <template v-else-if="!emailSent">
          <div class="flex items-center gap-2">
            <input
              v-model="emailInput"
              type="email"
              placeholder="New email address"
              class="flex-1 h-input bg-bg-3 border border-border rounded-sm px-[7px] text-xs text-text-1 font-sans outline-none transition-colors duration-[140ms] focus:border-accent placeholder:text-text-4"
            />
            <Button size="sm" variant="accent" :disabled="!emailInput.trim() || emailSending" @click="sendEmailChange">
              {{ emailSending ? 'Sending\u2026' : 'Send link' }}
            </Button>
            <Button size="sm" variant="ghost" @click="showEmailForm = false; emailError = ''">Cancel</Button>
          </div>
          <p v-if="emailError" class="text-[10px] text-danger">{{ emailError }}</p>
        </template>
        <p v-else class="text-xs text-text-3">
          Confirmation sent to <span class="text-text-2">{{ emailInput }}</span>. Click the link in your email to confirm.
        </p>
      </div>

    </div>
  </div>
</template>
