import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getUser, supabase } from '../lib/db'

// Sends a signed-in user with no saved thinking profile to the interview.
export default function OnboardingGate() {
  const nav = useNavigate()
  const loc = useLocation()
  const checkedFor = useRef<string | null>(null)

  useEffect(() => {
    if (loc.pathname === '/onboarding') return
    let cancelled = false
    ;(async () => {
      const user = await getUser()
      if (!user || cancelled || checkedFor.current === user.id) return
      const { data } = await supabase
        .from('thinking_profile')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled) return
      checkedFor.current = user.id
      if (!data) nav('/onboarding', { replace: true })
    })()
    return () => { cancelled = true }
  }, [loc.pathname])

  return null
}