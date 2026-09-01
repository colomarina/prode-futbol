import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type {
  AuthError,
  AuthResponse,
  AuthTokenResponsePassword,
  User,
  UserResponse,
} from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, TablesUpdate, Uuid } from '../types/domain'
import type { MutationResultWithData } from '../types/results'

/** Los dos campos que el perfil deja editar desde la app. */
export interface ProfileUpdates {
  username?: string
  full_name?: string
}

export interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  isPasswordRecovery: boolean
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string
  ) => Promise<MutationResultWithData<AuthResponse['data']>>
  signIn: (
    email: string,
    password: string
  ) => Promise<MutationResultWithData<AuthTokenResponsePassword['data']>>
  signOut: () => Promise<{ error: AuthError | null }>
  updateProfile: (profileUpdates: ProfileUpdates) => Promise<MutationResultWithData<Profile>>
  changePassword: (newPassword: string) => Promise<MutationResultWithData<UserResponse['data']>>
  resetPassword: (email: string, redirectTo: string) => Promise<MutationResultWithData<unknown>>
  isAdmin: () => boolean
}

/**
 * El default es `null` y no `{}`.
 *
 * Con `{}` el guard de `useAuth` (`if (!context) throw`) era **código muerto**: un
 * objeto vacío es truthy, así que usar el hook afuera del provider no explotaba,
 * devolvía un objeto sin campos y el error aparecía después, como un `undefined` en
 * pantalla. Con `null` el guard hace lo que dice.
 */
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash.includes('type=recovery') : false
  )

  const loadProfile = useCallback(async (userId: Uuid): Promise<Profile> => {
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

  const signUp: AuthContextValue['signUp'] = useCallback(
    async (email, password, username, fullName) => {
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
    },
    []
  )

  const signIn: AuthContextValue['signIn'] = useCallback(async (email, password) => {
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

  const signOut: AuthContextValue['signOut'] = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    setIsPasswordRecovery(false)
    setProfile(null)
    return { error }
  }, [])

  const updateProfile: AuthContextValue['updateProfile'] = useCallback(
    async profileUpdates => {
      try {
        if (!user?.id) {
          throw new Error('No hay una sesión activa')
        }

        const nextProfile: TablesUpdate<'profiles'> = {}

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

  const changePassword: AuthContextValue['changePassword'] = useCallback(async newPassword => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }, [])

  const resetPassword: AuthContextValue['resetPassword'] = useCallback(
    async (email, redirectTo) => {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        })

        if (error) throw error

        return { data, error: null }
      } catch (error) {
        return { data: null, error }
      }
    },
    []
  )

  const isAdmin = useCallback((): boolean => profile?.role === 'admin', [profile])

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
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
