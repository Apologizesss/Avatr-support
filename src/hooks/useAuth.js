import { useEffect, useState } from 'react'
import { getClient, getSupabaseConfig } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(!!getSupabaseConfig())

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }
    let sub
    try {
      const supabase = getClient()
      supabase.auth.getSession().then(({ data }) => {
        setUser(data?.session?.user ?? null)
        setLoading(false)
      })
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
      sub = data?.subscription
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
    return () => sub?.unsubscribe?.()
  }, [configured])

  const signIn = async (email, password) => {
    const supabase = getClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const supabase = getClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  // Detect admin: user has role='admin' in user_metadata OR app_metadata
  const isAdmin =
    user?.user_metadata?.role === 'admin' ||
    user?.app_metadata?.role === 'admin'

  return { user, loading, configured, setConfigured, signIn, signOut, isAdmin }
}
