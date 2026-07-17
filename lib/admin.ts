import { auth, currentUser } from '@clerk/nextjs/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export { currentUser }

export interface AdminInfo {
  id: string
  email: string
  role: 'super_admin' | 'admin'
  is_active: boolean
}

export async function isAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth()
    console.log('[ADMIN CHECK] userId:', userId)
    if (!userId) return false
    
    // Get user email from Clerk
    const user = await currentUser()
    console.log('[ADMIN CHECK] user:', user)
    if (!user?.emailAddresses || user.emailAddresses.length === 0) {
      console.log('[ADMIN CHECK] No email addresses found')
      return false
    }
    
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()
    console.log('[ADMIN CHECK] userEmail:', userEmail)
    if (!userEmail) {
      console.log('[ADMIN CHECK] userEmail is empty')
      return false
    }
    
    // Check database for admin status (use service role to bypass RLS)
    console.log('[ADMIN CHECK] Querying admins table for:', userEmail)
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('role, is_active')
      .eq('email', userEmail)
      .eq('is_active', true)
      .single()
    
    console.log('[ADMIN CHECK] Database query result:', { data, error })
    
    if (error || !data) {
      console.log('[ADMIN CHECK] Admin check failed - error:', error, 'data:', data)
      return false
    }
    
    console.log('[ADMIN CHECK] Admin check passed for:', userEmail)
    return true
  } catch (error) {
    console.error('[ADMIN CHECK] Error checking admin status:', error)
    return false
  }
}

export async function getAdminInfo(): Promise<AdminInfo | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null
    
    // Get user email from Clerk
    const user = await currentUser()
    if (!user?.emailAddresses || user.emailAddresses.length === 0) return null
    
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()
    if (!userEmail) return null
    
    // Check database for admin info (use service role to bypass RLS)
    console.log('[ADMIN INFO] Querying admins table for:', userEmail)
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', userEmail)
      .eq('is_active', true)
      .single()
    
    console.log('[ADMIN INFO] Database query result:', { data, error })
    
    if (error || !data) {
      console.log('[ADMIN INFO] Admin info check failed - error:', error, 'data:', data)
      return null
    }
    
    return data as AdminInfo
  } catch (error) {
    console.error('[ADMIN INFO] Error getting admin info:', error)
    return null
  }
}

export async function isSuperAdmin(): Promise<boolean> {
  const adminInfo = await getAdminInfo()
  return adminInfo?.role === 'super_admin'
}

export async function requireAdmin() {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Unauthorized: Admin access required')
  }
}

export async function requireSuperAdmin() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    throw new Error('Unauthorized: Super admin access required')
  }
}
