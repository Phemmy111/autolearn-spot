'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Plus, 
  Shield, 
  UserCheck, 
  UserX, 
  Trash2,
  ArrowLeft,
  RefreshCw,
  Crown,
  AlertCircle
} from 'lucide-react'

interface Admin {
  id: string
  email: string
  role: 'super_admin' | 'admin'
  is_active: boolean
  created_at: string
  created_by: string | null
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin')
  const [adding, setAdding] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'super_admin' | null>(null)

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins')
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/admin')
          return
        }
        throw new Error('Failed to fetch admins')
      }
      const data = await res.json()
      setAdmins(data.admins || [])
      
      // Find current user's role
      const userEmail = localStorage.getItem('userEmail') // This would need to be set during auth
      const currentUser = data.admins?.find((a: Admin) => a.email === userEmail)
      setCurrentUserRole(currentUser?.role || 'admin')
      
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [router])

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminEmail) return

    setAdding(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail,
          role: newAdminRole,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add admin')
      }

      setShowAddModal(false)
      setNewAdminEmail('')
      setNewAdminRole('admin')
      fetchAdmins()
    } catch (err: any) {
      setError(err.message || 'Failed to add admin')
    } finally {
      setAdding(false)
    }
  }

  const handleToggleActive = async (adminId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update admin')
      }

      fetchAdmins()
    } catch (err: any) {
      setError(err.message || 'Failed to update admin')
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return

    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete admin')
      }

      fetchAdmins()
    } catch (err: any) {
      setError(err.message || 'Failed to delete admin')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-[#00f0ff] animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-[#b9cacb]">Loading admins...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#b9cacb] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-heading text-4xl font-bold text-white">Admin Users</h1>
              <p className="font-mono text-sm text-[#b9cacb]">Manage admin access and roles</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Admin
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="border border-[#1f2229] bg-[#0c0e12] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1f2229]">
                <tr>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase text-[#b9cacb]">Email</th>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase text-[#b9cacb]">Role</th>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase text-[#b9cacb]">Status</th>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase text-[#b9cacb]">Created</th>
                  <th className="px-6 py-4 text-right font-mono text-xs uppercase text-[#b9cacb]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2229]">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-[#1f2229]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {admin.role === 'super_admin' && (
                          <Crown className="h-4 w-4 text-yellow-400" />
                        )}
                        <span className="font-mono text-sm text-white">{admin.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
                        admin.role === 'super_admin'
                          ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/50'
                          : 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/50'
                      }`}>
                        {admin.role === 'super_admin' ? (
                          <>
                            <Crown className="h-3 w-3" />
                            Super Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3" />
                            Admin
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
                        admin.is_active
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/50'
                          : 'bg-red-400/10 text-red-400 border border-red-400/50'
                      }`}>
                        {admin.is_active ? (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#5d5f63]">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(admin.id, admin.is_active)}
                          className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                          title={admin.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {admin.is_active ? (
                            <UserX className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-emerald-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl max-w-md w-full mx-4">
              <h2 className="font-heading text-2xl font-bold text-white mb-4">Add New Admin</h2>
              <form onSubmit={handleAddAdmin}>
                <div className="mb-4">
                  <label className="block font-mono text-xs text-[#b9cacb] mb-2">Email</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block font-mono text-xs text-[#b9cacb] mb-2">Role</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'super_admin')}
                    className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 border border-[#3b494b] text-[#b9cacb] font-mono text-sm px-4 py-2 rounded hover:bg-[#1f2229] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 bg-[#00f0ff] text-black font-bold font-mono text-sm px-4 py-2 rounded hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {adding ? 'Adding...' : 'Add Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
