export interface User {
  id:    string
  email: string
}

export type Plan = 'free' | 'pro'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | null

export interface UserProfile {
  id:                     string
  displayName:            string | null
  avatarUrl:              string | null
  plan:                   Plan
  subscriptionStatus:     SubscriptionStatus
  subscriptionPeriodEnd:  number | null   // ms timestamp
  storageUsedBytes:       number
  notificationPrefs:      Record<string, boolean>
}

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated'
