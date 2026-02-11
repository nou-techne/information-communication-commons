import { supabase } from './supabase'

/**
 * Sprint 26: Auth Flow Hardening
 * Session management utilities for magic link auth
 */

// Check and refresh session on app load
export async function initSession(): Promise<boolean> {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Session check error:', error)
    return false
  }

  if (!session) return false

  // Check if token is close to expiry (within 5 minutes)
  const expiresAt = session.expires_at
  if (expiresAt) {
    const now = Math.floor(Date.now() / 1000)
    const fiveMinutes = 5 * 60
    
    if (expiresAt - now < fiveMinutes) {
      // Token about to expire, try to refresh
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.error('Token refresh failed:', refreshError)
        await signOut()
        return false
      }
    }
  }

  return true
}

// Graceful sign out
export async function signOut() {
  try {
    await supabase.auth.signOut()
  } catch (e) {
    console.error('Sign out error:', e)
    // Force clear local storage even if API call fails
    localStorage.removeItem('sb-hvbdpgkdcdskhpbdeeim-auth-token')
  }
}

// Set up auth state change listener with expiry detection
export function onAuthStateChange(callback: (isAuthenticated: boolean) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      callback(!!session)
    } else if (event === 'SIGNED_IN') {
      callback(true)
    }
  })

  return subscription
}
