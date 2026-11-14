import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jhnjrpowpjciinsufkwc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export async function getUser() {
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user || null
  } catch { return null }
}
export async function signUp(email: string, password: string) { return supabase.auth.signUp({ email, password }) }
export async function signIn(email: string, password: string) { return supabase.auth.signInWithPassword({ email, password }) }
export async function signOut() { return supabase.auth.signOut() }
export async function addStars(userId: string, amount: number, source: string) {
  try {
    await supabase.from('stars').insert({ user_id: userId, amount, source })
    const { data: profile } = await supabase.from('profiles').select('stars').eq('id', userId).single()
    const next = (profile?.stars || 0) + amount
    await supabase.from('profiles').update({ stars: next }).eq('id', userId)
    return next
  } catch { return amount }
}