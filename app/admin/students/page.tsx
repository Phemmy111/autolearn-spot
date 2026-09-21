import React from 'react';
import { User, BookOpen, Calendar, CreditCard, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { ManualEnrollmentForm } from './ManualEnrollmentForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminStudentsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  // Simple query to debug - just get all enrollments
  const { data: enrollments, error } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching enrollments:', error);
  }

  const safeEnrollments = enrollments || [];

  // Debug: Log what we got
  console.log('Total enrollments found:', safeEnrollments.length);
  console.log('Sample enrollment:', safeEnrollments[0]);

  // Get unique students (by clerk_user_id) with their enrollments
  const studentsMap = new Map();
  
  safeEnrollments.forEach(e => {
    const studentId = e.clerk_user_id || e.email;
    
    if (!studentsMap.has(studentId)) {
      studentsMap.set(studentId, {
        id: studentId,
        name: e.full_name || 'No name',
        email: e.email,
        courses: [e.learning_product_id || e.cohort_id || 'Unknown'],
        totalAmount: e.payment_amount || e.amount_paid || 0,
        enrollments: 1,
        latestEnrollment: e.activated_at || e.enrolled_at || 'N/A',
        latestStatus: e.status || 'inactive',
        isProductBased: !!e.learning_product_id
      });
    } else {
      // Add additional courses to existing student
      const student = studentsMap.get(studentId);
      const courseId = e.learning_product_id || e.cohort_id || 'Unknown';
      
      if (courseId !== 'Unknown') {
        student.courses.push(courseId);
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
                <th className="p-4 font-medium">Type</th>
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
                  <td className="p-4">
                    <span className="text-xs font-medium text-gray-500">
                      {item.isProductBased ? 'Product' : 'Cohort'}
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
              Students will appear here once they enroll in courses or products.
              Use the form above to manually enroll students.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
