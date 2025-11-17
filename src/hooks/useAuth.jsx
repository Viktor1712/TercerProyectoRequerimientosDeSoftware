import { useEffect, useState, createContext, useContext } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const auth = useProvideAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

function useProvideAuth() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      if (data.session?.user) {
        await fetchUserProfile(data.session.user.id)
      }
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  const fetchUserProfile = async (id) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, is_admin')
        .eq('id', id)
        .single()
      if (error) throw error
      setUser(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  const signInWithEmail = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
    setUser(null)
  }

  return { session, user, loading, signInWithEmail, signOut }
}
