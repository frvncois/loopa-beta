// Supabase Edge Function — send-transfer-email
// Handles project ownership transfer operations.
// Secrets required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SITE_URL
//
// Body: { action: 'initiate', projectId: string, toEmail: string }
//     | { action: 'accept',   transferId: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
    const body    = await req.json() as { action: string; projectId?: string; toEmail?: string; transferId?: string }

    // ── Initiate transfer ────────────────────────────────────────────────────
    if (body.action === 'initiate') {
      const { projectId, toEmail } = body
      if (!projectId || !toEmail) return json({ error: 'projectId and toEmail are required' }, 400)

      // Verify caller owns the project
      const { data: project, error: projErr } = await supabase
        .from('projects')
        .select('id, name, owner_id')
        .eq('id', projectId)
        .single()
      if (projErr || !project) return json({ error: 'Project not found' }, 404)
      if (project.owner_id !== user.id) return json({ error: 'Forbidden' }, 403)

      // Look up recipient by email via Admin Auth API
      const usersRes = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users?email=${encodeURIComponent(toEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          },
        },
      )
      const usersData = await usersRes.json() as { users?: { id: string; email: string }[] }
      const recipient = usersData.users?.[0]
      if (!recipient) {
        return json(
          { error: 'No Loopa account found for that email. The recipient needs to sign up first.' },
          404,
        )
      }
      if (recipient.id === user.id) {
        return json({ error: 'You cannot transfer a project to yourself.' }, 400)
      }

      // Check for existing pending transfer
      const { data: existing } = await supabase
        .from('ownership_transfers')
        .select('id')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .maybeSingle()
      if (existing) {
        return json({ error: 'A transfer is already pending for this project.' }, 409)
      }

      // Insert transfer row
      const { data: transfer, error: insertErr } = await supabase
        .from('ownership_transfers')
        .insert({
          project_id:   projectId,
          from_user_id: user.id,
          to_user_id:   recipient.id,
          status:       'pending',
        })
        .select()
        .single()
      if (insertErr || !transfer) return json({ error: 'Failed to create transfer' }, 500)

      // Send magic link email to recipient; clicking it signs them in and lands on the transfer
      const redirectUrl = `${siteUrl}/auth/callback?redirect=${encodeURIComponent(`/dashboard?transfer=${transfer.id}`)}`
      await supabase.auth.admin.generateLink({
        type:    'magiclink',
        email:   toEmail,
        options: { redirectTo: redirectUrl },
      })

      return json({ ok: true, transferId: transfer.id })
    }

    // ── Accept transfer ──────────────────────────────────────────────────────
    if (body.action === 'accept') {
      const { transferId } = body
      if (!transferId) return json({ error: 'transferId is required' }, 400)

      const { data: transfer, error: transferErr } = await supabase
        .from('ownership_transfers')
        .select('id, project_id, from_user_id, to_user_id, status, expires_at')
        .eq('id', transferId)
        .single()
      if (transferErr || !transfer) return json({ error: 'Transfer not found' }, 404)
      if (transfer.to_user_id !== user.id)   return json({ error: 'Forbidden' }, 403)
      if (transfer.status !== 'pending')     return json({ error: `Transfer is already ${transfer.status}` }, 409)
      if (new Date(transfer.expires_at) < new Date()) return json({ error: 'Transfer has expired' }, 410)

      // Enforce free plan limit for recipient
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      if (recipientProfile?.plan === 'free') {
        const { count } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .is('trashed_at', null)
        if ((count ?? 0) >= 3) {
          return json(
            { error: 'You have reached the free plan limit of 3 projects. Upgrade to Pro to accept this transfer.' },
            422,
          )
        }
      }

      // Transfer ownership
      const { error: updateErr } = await supabase
        .from('projects')
        .update({ owner_id: user.id })
        .eq('id', transfer.project_id)
      if (updateErr) return json({ error: 'Failed to transfer project ownership' }, 500)

      // Mark transfer accepted
      await supabase
        .from('ownership_transfers')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', transferId)

      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
