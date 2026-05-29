'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database.types'

interface UserContextValue {
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }

  useEffect(() => {
    const supabase = supabaseRef.current!

    async function loadProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          setProfile(null)
          setLoading(false)
          return
        }

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile(data)
      } catch (err) {
        console.error('Failed to load profile:', err)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const refreshProfile = async () => {
    setLoading(true)
    const supabase = supabaseRef.current!
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setProfile(null)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(data)
    } catch (err) {
      console.error('Failed to refresh profile:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
