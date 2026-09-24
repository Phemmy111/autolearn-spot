import React from 'react';
import { Award, Download, User, BookOpen } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCertificatesPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  // Fetch product purchasers from orders and order_items
  const { data: orderItems } = await supabaseAdmin
    .from('order_items')
    .select(`
      id,
      product_title,
      price_snapshot,
      created_at,
      order_id,
      orders!inner(
        id,
        user_id,
        customer_name,
        customer_email,
        status
      )
    `)
    .eq('orders.status', 'PAID')
    .order('created_at', { ascending: false });

  // Fetch all certificates
  const { data: certificates } = await supabaseAdmin
    .from('certificates')
    .select('id, certificate_code, user_id, user_name, user_email, issued_at, cohort_id, cohorts(name, learning_products(title))')
    .order('issued_at', { ascending: false });

  const safeOrderItems = orderItems || [];
  const safeCertificates = certificates || [];

  // Group by student email
  const studentsMap = new Map();

  const getFallbackName = (email: string) => {
    if (!email) return 'Student';
    const prefix = email.split('@')[0];
    return prefix.replace(/[0-9]/g, '').replace(/\b\w/g, l => l.toUpperCase()) || 'Student';
  };

  // Process order items (product purchasers)
  safeOrderItems.forEach(item => {
    const userId = item.orders.user_id || item.orders.customer_email;
    const userName = item.orders.customer_name || 'Unknown';
    const userEmail = item.orders.customer_email || item.orders.user_id || 'Unknown';
    const courseTitle = item.product_title || 'Unknown Course';

    if (!studentsMap.has(userId)) {
      let name = userName;
      if (!name || name.trim() === '' || name === 'Student' || name === 'Unknown') {
        name = getFallbackName(userEmail);
      }

      studentsMap.set(userId, {
        name,
        email: userEmail,
        userId: item.orders.user_id,
        courses: []
      });
    }

    const student = studentsMap.get(userId);
    // Avoid duplicates
    if (!student.courses.find((c: any) => c.title === courseTitle)) {
       student.courses.push({
         title: courseTitle,
         certificate: null
       });
    }
  });

  // Process certificates to attach to courses
  safeCertificates.forEach(cert => {
    if (!cert.user_email) return;
    const lp = cert.cohorts?.learning_products;
    const cName = cert.cohorts?.name;
    const courseTitle = lp?.title || cName || 'Unknown Course';

    if (!studentsMap.has(cert.user_email)) {
      let name = cert.user_name;
      if (!name || name.trim() === '' || name === 'Student') {
        name = getFallbackName(cert.user_email);
      }

      studentsMap.set(cert.user_email, {
        name,
        email: cert.user_email,
        userId: cert.user_id,
        courses: []
      });
    } else {
      // Update name if certificate has a better one
      const student = studentsMap.get(cert.user_email);
      if (cert.user_name && cert.user_name !== 'Student' && cert.user_name.trim() !== '') {
        const fallback = getFallbackName(cert.user_email);
        if (student.name === 'Student' || student.name === fallback) {
          student.name = cert.user_name;
        }
      }
    }

    const student = studentsMap.get(cert.user_email);
    // Find or add course
    let courseObj = student.courses.find((c: any) => c.title === courseTitle);
    if (!courseObj) {
      courseObj = { title: courseTitle, certificate: null };
      student.courses.push(courseObj);
    }
    // Attach certificate
    if (!courseObj.certificate) {
      courseObj.certificate = cert;
    }
  });

  const studentsList = Array.from(studentsMap.values());

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold capitalize">Certificates</h1>
      </div>
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {studentsList.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-4 font-medium w-1/3">Student</th>
                <th className="p-4 font-medium">Courses &amp; Certificates</th>
              </tr>
            </thead>
            <tbody>
              {studentsList.map((student, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors align-top">
                  <td className="p-4">
                    <div className="flex items-start gap-3 mt-2">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-3">
                      {student.courses.map((course: any, cIdx: number) => (
                        <div key={cIdx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
                              {course.certificate ? (
                                <Award className="h-4 w-4 text-yellow-600" />
                              ) : (
                                <BookOpen className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{course.title}</div>
                              {course.certificate && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Code: <span className="font-mono text-blue-600">{course.certificate.certificate_code}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <a 
                              href={`/api/certificate/download?userId=${student.userId}&name=${encodeURIComponent(student.name)}&course=${encodeURIComponent(course.title)}${course.certificate ? '&certificateId=' + course.certificate.id : ''}`}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-brand-text/60">No students or certificates found.</p>
        )}
      </div>
    </div>
  );
}
