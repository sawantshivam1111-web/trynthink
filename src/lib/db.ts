import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jhnjrpowpjciinsufkwc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
if (!supabaseAnonKey) console.error('TryNThink: VITE_SUPABASE_ANON_KEY is missing')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

// Reads the signed-in user from the browser's saved session (no network call).
// Expired sessions are refreshed automatically by supabase-js.
export async function getUser() {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user ?? null
  } catch (e) {
    console.error('getUser failed', e)
    return null
  }
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function addStars(userId: string, amount: number, source: string) {
  try {
    const { error: insErr } = await supabase.from('stars').insert({ user_id: userId, amount, source })
    if (insErr) console.error('addStars insert failed', insErr)
    const { data: profile, error: selErr } = await supabase
      .from('profiles').select('stars').eq('id', userId).maybeSingle()
    if (selErr) console.error('addStars select failed', selErr)
    const next = (profile?.stars || 0) + amount
    const { error: updErr } = await supabase.from('profiles').update({ stars: next }).eq('id', userId)
    if (updErr) console.error('addStars update failed', updErr)
    return next
  } catch (e) {
    console.error('addStars failed', e)
    return amount
  }
}