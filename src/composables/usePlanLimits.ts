import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

// ── Constants ────────────────────────────────────────────────────────────────

const FREE_PROJECTS  = 3
const FREE_STORAGE   = 1_073_741_824    // 1 GB
const PRO_STORAGE    = 10_737_418_240   // 10 GB

// ── Upgrade modal state (module-level singleton) ──────────────────────────────

type UpgradeVariant = 'projects' | 'storage'
const _upgradeModal = ref<UpgradeVariant | null>(null)

export function usePlanLimits() {
  const auth = useAuthStore()

  const plan             = computed(() => auth.profile?.plan ?? 'free')
  const storageLimit     = computed(() => plan.value === 'pro' ? PRO_STORAGE : FREE_STORAGE)
  const storageUsed      = computed(() => auth.profile?.storageUsedBytes ?? 0)
  const storageRemaining = computed(() => Math.max(0, storageLimit.value - storageUsed.value))
  const atStorageLimit   = computed(() => storageUsed.value >= storageLimit.value)

  function atProjectLimit(activeCount: number): boolean {
    return plan.value === 'free' && activeCount >= FREE_PROJECTS
  }

  function showUpgradeModal(variant: UpgradeVariant = 'projects'): void {
    _upgradeModal.value = variant
  }

  function hideUpgradeModal(): void {
    _upgradeModal.value = null
  }

  return {
    plan,
    storageLimit,
    storageUsed,
    storageRemaining,
    atStorageLimit,
    atProjectLimit,
    upgradeModalVariant: _upgradeModal as Readonly<typeof _upgradeModal>,
    showUpgradeModal,
    hideUpgradeModal,
  }
}
