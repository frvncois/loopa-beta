import { supabase } from '@/core/supabase/client'

// Stripe price IDs — set VITE_STRIPE_PRICE_MONTHLY and VITE_STRIPE_PRICE_YEARLY in .env
const PRICE_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_MONTHLY as string | undefined
const PRICE_YEARLY  = import.meta.env.VITE_STRIPE_PRICE_YEARLY  as string | undefined

export function useBilling() {
  async function startCheckout(period: 'monthly' | 'yearly'): Promise<void> {
    const priceId = period === 'yearly' ? PRICE_YEARLY : PRICE_MONTHLY
    if (!priceId) throw new Error(`VITE_STRIPE_PRICE_${period.toUpperCase()} is not set`)

    const { data, error } = await supabase.functions.invoke<{ url: string }>('stripe-checkout', {
      body: { priceId },
    })
    if (error) throw error
    if (!data?.url) throw new Error('No checkout URL returned')
    window.location.href = data.url
  }

  async function openCustomerPortal(): Promise<void> {
    const { data, error } = await supabase.functions.invoke<{ url: string }>('stripe-portal')
    if (error) throw error
    if (!data?.url) throw new Error('No portal URL returned')
    window.location.href = data.url
  }

  return { startCheckout, openCustomerPortal }
}
