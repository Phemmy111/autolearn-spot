import { auth, currentUser } from '@clerk/nextjs/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export { currentUser }

export interface AdminInfo {
  id: string
  email: string
  role: 'super_admin' | 'admin'
  is_active: boolean
}

const ROOT_SUPER_ADMIN_EMAILS = [
  'autolearnspot@gmail.com',
  'femiadeleke2020@gmail.com',
  'femiadeleke200@gmail.com',
  'femi@autolearnspot.com',
  'marvellousomobomi@gmail.com'
]

const ROOT_SUPER_ADMIN_USER_IDS = [
  'user_3GQ7AMAdhmPHBSaBhlAXgVyX5sI', // Femi Adeleke
  'user_3GYbgK6hkYBX8AwqJRXn5BiBikW', // Omobomi Marvellous
  'user_3JI4lwWSCQXqH9LKg30kcabvJmV'  // Femi Adeleke (admin)
]

export async function isAdmin(): Promise<boolean> {
  try {
    const authData = await auth()
    const { userId, sessionClaims } = authData
    if (!userId) return false

    // Direct root super admin user id check
    if (ROOT_SUPER_ADMIN_USER_IDS.includes(userId)) {
      return true
    }

    // Check email from session claims if available
    const sessionEmail = ((sessionClaims as any)?.email || (sessionClaims as any)?.primaryEmail || (sessionClaims as any)?.email_address)?.toLowerCase()
    if (sessionEmail && ROOT_SUPER_ADMIN_EMAILS.includes(sessionEmail)) {
      return true
    }
    
    // Get user email from Clerk currentUser() if available
    let userEmail = sessionEmail
    if (!userEmail) {
      try {
        const user = await currentUser()
        userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
      } catch (err) {
        console.warn('Could not fetch Clerk currentUser:', err)
      }
    }

    // Check if user is active in authors table
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('email, status')
      .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle()

    if (author?.email && ROOT_SUPER_ADMIN_EMAILS.includes(author.email.toLowerCase())) {
      return true
    }

    if (userEmail && ROOT_SUPER_ADMIN_EMAILS.includes(userEmail)) {
      return true
    }

    // Check ADMIN_EMAILS environment variable (fallback approach)
    const adminEmails = process.env.ADMIN_EMAILS
    if (adminEmails && userEmail) {
      const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase())
      if (allowedEmails.includes(userEmail)) {
        return true
      }
    }
    
    // Fall back to database check (service role to bypass RLS)
    if (userEmail) {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('role, is_active')
        .eq('email', userEmail)
        .eq('is_active', true)
        .maybeSingle()
      
      if (!error && data) return true
    }
    
    return false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function getAdminInfo(): Promise<AdminInfo | null> {
  try {
    const authData = await auth()
    const { userId, sessionClaims } = authData
    if (!userId) return null

    // Direct root super admin user id check
    if (ROOT_SUPER_ADMIN_USER_IDS.includes(userId)) {
      return {
        id: userId,
        email: 'admin@autolearnspot.com',
        role: 'super_admin',
        is_active: true
      }
    }
    
    const sessionEmail = ((sessionClaims as any)?.email || (sessionClaims as any)?.primaryEmail || (sessionClaims as any)?.email_address)?.toLowerCase()
    let userEmail = sessionEmail

    if (!userEmail) {
      try {
        const user = await currentUser()
        userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
      } catch (err) {
        console.warn('Could not fetch Clerk currentUser:', err)
      }
    }
    
    // Check authors table
    if (!userEmail) {
      const { data: author } = await supabaseAdmin
        .from('authors')
        .select('email')
        .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
        .maybeSingle()
      if (author?.email) {
        userEmail = author.email.toLowerCase()
      }
    }

    if (userEmail && ROOT_SUPER_ADMIN_EMAILS.includes(userEmail)) {
      return {
        id: userId,
        email: userEmail,
        role: 'super_admin',
        is_active: true
      }
    }

    // Check database for admin info (use service role to bypass RLS)
    if (userEmail) {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .maybeSingle()
      
      if (!error && data) {
        return data as AdminInfo
      }
    }
    
    return null
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
