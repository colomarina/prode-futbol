import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash.includes('type=recovery') : false
  )

  const loadProfile = useCallback(async userId => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) throw error
      setProfile(data)
      return data
    } catch (error) {
      setProfile(null)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).catch(() => {})
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsPasswordRecovery(
        current =>
          current ||
          _event === 'PASSWORD_RECOVERY' ||
          (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
      )
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).catch(() => {})
      } else {
        setProfile(null)
        setIsPasswordRecovery(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signUp = useCallback(async (email, password, username, fullName) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError
      return { data: authData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    setIsPasswordRecovery(false)
    setProfile(null)
    return { error }
  }, [])

  const updateProfile = useCallback(
    async profileUpdates => {
      try {
        if (!user?.id) {
          throw new Error('No hay una sesión activa')
        }

        const nextProfile = {}

        if (Object.prototype.hasOwnProperty.call(profileUpdates, 'username')) {
          nextProfile.username = profileUpdates.username.trim()
        }

        if (Object.prototype.hasOwnProperty.call(profileUpdates, 'full_name')) {
          const normalizedFullName = profileUpdates.full_name.trim()
          nextProfile.full_name = normalizedFullName || null
        }

        if (Object.keys(nextProfile).length === 0) {
          throw new Error('No hay cambios para guardar')
        }

        const { data, error } = await supabase
          .from('profiles')
          .update(nextProfile)
          .eq('id', user.id)
          .select('*')
          .single()

        if (error) throw error

        setProfile(data)
        return { data, error: null }
      } catch (error) {
        return { data: null, error }
      }
    },
    [user]
  )

  const changePassword = useCallback(async newPassword => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }, [])

  const resetPassword = useCallback(async (email, redirectTo) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }, [])

  const isAdmin = useCallback(() => profile?.role === 'admin', [profile])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isPasswordRecovery,
      signUp,
      signIn,
      signOut,
      updateProfile,
      changePassword,
      resetPassword,
      isAdmin,
    }),
    [
      user,
      profile,
      loading,
      isPasswordRecovery,
      signUp,
      signIn,
      signOut,
      updateProfile,
      changePassword,
      resetPassword,
      isAdmin,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
