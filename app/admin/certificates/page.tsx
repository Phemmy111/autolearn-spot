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

  // Fetch all enrollments
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select(`
      id, clerk_user_id, full_name, email,
      learning_product:learning_products (title),
      cohorts (name)
    `)
    .in('status', ['active', 'completed', 'successful']);

  // Fetch all certificates
  const { data: certificates } = await supabaseAdmin
    .from('certificates')
    .select('id, certificate_code, user_id, user_name, user_email, issued_at, cohort_id, cohorts(name, learning_products(title))')
    .order('issued_at', { ascending: false });

  const safeEnrollments = enrollments || [];
  const safeCertificates = certificates || [];

  // Group by student email
  const studentsMap = new Map();

  // Process enrollments
  safeEnrollments.forEach(enr => {
    if (!enr.email) return;
    const lp = Array.isArray(enr.learning_product) ? enr.learning_product[0] : enr.learning_product;
    const courseTitle = lp?.title || enr.cohorts?.name || 'Unknown Course';
    // Map legacy cohorts to current product titles
    const displayCourse = courseTitle === 'Cohort 1' ? 'AI Automation with n8n' : courseTitle === 'Cohort 2' ? 'AI Video Content Creation' : courseTitle;
    
    if (!studentsMap.has(enr.email)) {
      studentsMap.set(enr.email, {
        name: enr.full_name || 'Student',
        email: enr.email,
        userId: enr.clerk_user_id,
        courses: []
      });
    }
    
    const student = studentsMap.get(enr.email);
    // Avoid duplicates
    if (!student.courses.find((c: any) => c.title === displayCourse)) {
       student.courses.push({
         title: displayCourse,
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
    const displayCourse = courseTitle === 'Cohort 1' ? 'AI Automation with n8n' : courseTitle === 'Cohort 2' ? 'AI Video Content Creation' : courseTitle;

    if (!studentsMap.has(cert.user_email)) {
      studentsMap.set(cert.user_email, {
        name: cert.user_name || 'Student',
        email: cert.user_email,
        userId: cert.user_id,
        courses: []
      });
    }

    const student = studentsMap.get(cert.user_email);
    // Find or add course
    let courseObj = student.courses.find((c: any) => c.title === displayCourse);
    if (!courseObj) {
      courseObj = { title: displayCourse, certificate: null };
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
