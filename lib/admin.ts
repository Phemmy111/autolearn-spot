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
    if (!userId) return false
    
    // Get user email from Clerk
    const user = await currentUser()
    if (!user?.emailAddresses || user.emailAddresses.length === 0) return false
    
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()
    if (!userEmail) return false
    
    // First check ADMIN_EMAILS environment variable (fallback approach)
    const adminEmails = process.env.ADMIN_EMAILS
    if (adminEmails) {
      const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase())
      if (allowedEmails.includes(userEmail)) {
        return true
      }
    }
    
    // Fall back to database check (service role to bypass RLS)
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('role, is_active')
      .eq('email', userEmail)
      .eq('is_active', true)
      .single()
    
    if (error || !data) return false
    
    return true
  } catch (error) {
    console.error('Error checking admin status:', error)
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
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', userEmail)
      .eq('is_active', true)
      .single()
    
    if (error || !data) return null
    
    return data as AdminInfo
  } catch (error) {
    console.error('Error getting admin info:', error)
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
