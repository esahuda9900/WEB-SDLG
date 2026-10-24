import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, type UserRoleRow } from '../lib/supabase'

type AuthState = {
  session: Session | null
  user: User | null
  role: UserRoleRow | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthState | null>(null)

async function fetchRole(userId: string): Promise<UserRoleRow | null> {
  const { data, error } = await supabase
    .from('app_user_roles')
    .select('user_id, role, branch_id, display_name, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('fetchRole', error.message)
    return null
  }
  return data as UserRoleRow | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRoleRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        const r = await fetchRole(data.session.user.id)
        if (mounted) setRole(r)
      }
      if (mounted) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
      if (next?.user) {
        const r = await fetchRole(next.user.id)
        setRole(r)
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      return { ok: false, message: err.message }
    }
    if (data.user) {
      const r = await fetchRole(data.user.id)
      setRole(r)
      if (!r || !r.is_active) {
        await supabase.auth.signOut()
        const msg = 'Akun belum punya akses aktif. Hubungi admin.'
        setError(msg)
        return { ok: false, message: msg }
      }
      if (r.role !== 'admin' && r.role !== 'warranty_admin') {
        // M2: hanya admin dulu
        await supabase.auth.signOut()
        const msg = 'Sementara hanya role admin yang boleh masuk.'
        setError(msg)
        return { ok: false, message: msg }
      }
    }
    return { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    await supabase.auth.signOut()
    setRole(null)
  }, [])

  const isAdmin = role?.role === 'admin' || role?.role === 'warranty_admin'

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      loading,
      error,
      signIn,
      signOut,
      isAdmin,
    }),
    [session, user, role, loading, error, signIn, signOut, isAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider')
  return ctx
}
