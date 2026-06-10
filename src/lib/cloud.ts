import { createClient, type Session } from '@supabase/supabase-js'
import type { AppState } from '../types'

/**
 * Cloud accounts + sync (Supabase free tier).
 *
 * The publishable key below is safe to ship in client code by design —
 * all data access is enforced server-side with row-level security
 * (each user can only read/write their own row).
 *
 * Sync model: on sign-in the cloud copy wins (that's what logging in
 * means); afterwards every local change is debounced-pushed. Course
 * downloads and swing videos stay on-device (they're large and
 * re-downloadable); profile, bag, rounds, range sessions and the
 * handicap record all sync.
 */

const SUPABASE_URL = 'https://urimnwwqkxprvhjsfgla.supabase.co'
const SUPABASE_KEY = 'sb_publishable_l77UUDEGguEaai_1tPvT-Q_he0JIL7c'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export interface CloudUser {
  id: string
  email: string
}

export function onAuthChange(cb: (user: CloudUser | null) => void): () => void {
  supabase.auth.getSession().then(({ data }) => cb(toUser(data.session)))
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(toUser(session)))
  return () => data.subscription.unsubscribe()
}

function toUser(session: Session | null): CloudUser | null {
  if (!session?.user) return null
  return { id: session.user.id, email: session.user.email ?? '' }
}

export async function signUp(email: string, password: string): Promise<{ needsConfirm: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(friendly(error.message))
  return { needsConfirm: !data.session }
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(friendly(error.message))
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw new Error(friendly(error.message))
}

function friendly(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.'
  if (/already registered/i.test(msg)) return 'That email already has an account — sign in instead.'
  if (/password should be/i.test(msg)) return 'Password needs at least 6 characters.'
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts — wait a minute and try again.'
  return msg
}

// ── State sync ──────────────────────────────────────────────────────────

export async function pullState(): Promise<{ state: AppState; updatedAt: string } | null> {
  const { data, error } = await supabase.from('user_state').select('state, updated_at').maybeSingle()
  if (error || !data) return null
  return { state: data.state as AppState, updatedAt: data.updated_at as string }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null
let lastPushOk: number | null = null

export function schedulePush(state: AppState, userId: string, onResult?: (ok: boolean) => void): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    const { error } = await supabase
      .from('user_state')
      .upsert({ user_id: userId, state: state as never, updated_at: new Date().toISOString() })
    if (!error) lastPushOk = Date.now()
    onResult?.(!error)
  }, 2500)
}

export function lastSyncedAt(): number | null {
  return lastPushOk
}
