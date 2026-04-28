// Supabase Edge Function — stripe-webhook
// Receives Stripe events and updates the profiles table.
// Secrets required (set via `supabase secrets set`):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // @ts-ignore
  apiVersion: '2024-06-20',
})

Deno.serve(async (req: Request) => {
  const sig    = req.headers.get('stripe-signature')
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  if (!sig) return new Response('Missing stripe-signature', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret)
  } catch (err) {
    return new Response(
      `Webhook signature verification failed: ${err instanceof Error ? err.message : err}`,
      { status: 400 },
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        await syncSubscription(supabase, sub)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await syncSubscription(supabase, sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('profiles')
          .update({
            plan:                    'free',
            stripe_subscription_id:  null,
            subscription_status:     'canceled',
            subscription_period_end: null,
          })
          .eq('stripe_customer_id', sub.customer as string)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response('Handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function syncSubscription(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
): Promise<void> {
  const plan       = (sub.status === 'active' || sub.status === 'trialing') ? 'pro' : 'free'
  const periodEnd  = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null

  await supabase
    .from('profiles')
    .update({
      plan,
      stripe_subscription_id:  sub.id,
      subscription_status:     sub.status,
      subscription_period_end: periodEnd,
    })
    .eq('stripe_customer_id', sub.customer as string)
}
