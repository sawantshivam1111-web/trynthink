import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jhnjrpowpjciinsufkwc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is missing. Add it in Vercel Environment Variables and redeploy.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Reads the saved session from local storage. No network call, so it doesn't
// return null just because a request was slow or failed.
export async function getUser() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) return null
    return data.session?.user ?? null
  } catch {
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
    if (insErr) throw insErr

    const { data: profile, error: readErr } = await supabase
      .from('profiles')
      .select('stars')
      .eq('id', userId)
      .maybeSingle()
    if (readErr) throw readErr

    const next = (profile?.stars || 0) + amount
    const { error: upErr } = await supabase.from('profiles').update({ stars: next }).eq('id', userId)
    if (upErr) throw upErr
    return next
  } catch {
    return amount
  }
}