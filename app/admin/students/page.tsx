import React from 'react';
import { User, BookOpen, Calendar, CreditCard, Users, Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ManualEnrollmentForm() {
  return (
    <div className="mb-6 bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-brand-text mb-4">Manual Enrollment</h2>
      <form action="/api/admin/enrollments/manual" method="POST" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Email *</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="student@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Cohort ID *</label>
          <input
            type="text"
            name="cohortId"
            required
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="cohort-uuid"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Status</label>
          <select
            name="status"
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <label className="block text-sm font-medium text-brand-text/70 mb-1">Reason (Optional)</label>
          <input
            type="text"
            name="reason"
            className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Reason for manual enrollment"
          />
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Enroll Student
          </button>
        </div>
      </form>
    </div>
  );
}

export default async function AdminStudentsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  // Fetch all enrolled students
  const { data: enrollments, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      id,
      clerk_user_id,
      full_name,
      email,
      payment_amount,
      amount_paid,
      status,
      activated_at,
      enrolled_at,
      learning_product:learning_products (
        title,
        access_duration_days
      )
    `)
    .order('created_at', { ascending: false });

  const safeEnrollments = enrollments || [];

  // Get unique students (by clerk_user_id) with their enrollments
  const studentsMap = new Map();
  
  safeEnrollments.forEach(e => {
    const studentId = e.clerk_user_id || e.email;
    if (!studentsMap.has(studentId)) {
      const product = Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product;
      
      let daysLeft = null;
      if (e.status === 'active' && e.activated_at && product?.access_duration_days) {
        const start = new Date(e.activated_at).getTime();
        const now = Date.now();
        const durationMs = product.access_duration_days * 24 * 60 * 60 * 1000;
        daysLeft = Math.max(0, Math.ceil((start + durationMs - now) / (1000 * 60 * 60 * 24)));
      }

      studentsMap.set(studentId, {
        id: studentId,
        name: e.full_name || 'No name',
        email: e.email,
        courses: [product ? product.title : 'Unknown Course'],
        totalAmount: e.payment_amount || e.amount_paid || 0,
        enrollments: 1,
        latestEnrollment: e.activated_at || e.enrolled_at || 'N/A',
        latestStatus: e.status || 'inactive',
        days_left: daysLeft
      });
    } else {
      // Add additional courses to existing student
      const student = studentsMap.get(studentId);
      const product = Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product;
      if (product) {
        student.courses.push(product.title);
      }
      student.totalAmount += (e.payment_amount || e.amount_paid || 0);
      student.enrollments += 1;
      
      // Update to latest enrollment date
      const enrollmentDate = e.activated_at || e.enrolled_at;
      if (enrollmentDate && enrollmentDate > student.latestEnrollment) {
        student.latestEnrollment = enrollmentDate;
        student.latestStatus = e.status || 'inactive';
      }
    }
  });

  const students = Array.from(studentsMap.values());

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold capitalize">Students</h1>
        <div className="flex items-center gap-2 text-sm text-brand-text/60">
          <Users className="h-4 w-4" />
          <span>{students.length} total students</span>
        </div>
      </div>
      
      <ManualEnrollmentForm />
      
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {students.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-4 font-medium">Name &amp; Email</th>
                <th className="p-4 font-medium">Courses</th>
                <th className="p-4 font-medium">Enrollments</th>
                <th className="p-4 font-medium">Total Amount</th>
                <th className="p-4 font-medium">Latest Enrollment</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-sm">{item.courses.length} course{item.courses.length !== 1 ? 's' : ''}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {item.courses.slice(0, 2).join(', ')}
                          {item.courses.length > 2 && '...'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-gray-700">{item.enrollments}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span>₦{item.totalAmount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{item.latestEnrollment !== 'N/A' ? new Date(item.latestEnrollment).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ 
                      item.latestStatus === 'active' || item.latestStatus === 'successful' 
                        ? 'bg-green-100 text-green-800' 
                        : item.latestStatus === 'not_started'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.latestStatus.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-brand-text/60 mb-2">No students found.</p>
            <p className="text-sm text-brand-text/40">
              Use the form above to manually enroll students, or students will appear here once they enroll in courses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
