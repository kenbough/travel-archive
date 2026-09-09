import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { demoCategories, demoTrips } from '../lib/mock-data'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client'
import { createTrip, fetchArchiveData } from '../lib/supabase/trips'
import type { Category, NewTripInput, Trip } from '../lib/types'

export function useTravelArchive() {
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>(isSupabaseConfigured ? [] : demoCategories)
  const [trips, setTrips] = useState<Trip[]>(isSupabaseConfigured ? [] : demoTrips)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    try {
      const data = await fetchArchiveData()
      setCategories(data.categories)
      setTrips(data.trips)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データを読み込めませんでした。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    let alive = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setUser(data.session?.user ?? null)
      if (data.session?.user) void refresh()
      else setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      setUser(session?.user ?? null)
      if (session?.user) queueMicrotask(() => void refresh())
      else {
        setCategories([])
        setTrips([])
        setLoading(false)
      }
    })

    return () => {
      alive = false
      subscription.subscription.unsubscribe()
    }
  }, [refresh])

  const addTrip = useCallback(async (input: NewTripInput) => {
    if (!isSupabaseConfigured) {
      setTrips((current) => [{ ...input, id: `demo-${Date.now()}` }, ...current])
      return
    }
    if (!user) throw new Error('ログインが必要です。')
    await createTrip(user, input)
    await refresh()
  }, [refresh, user])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (supabase) await supabase.auth.signOut()
  }, [])

  return useMemo(() => ({
    user,
    categories,
    trips,
    loading,
    error,
    addTrip,
    refresh,
    signOut,
    isDemo: !isSupabaseConfigured,
    authRequired: isSupabaseConfigured && !loading && !user,
  }), [user, categories, trips, loading, error, addTrip, refresh, signOut])
}
