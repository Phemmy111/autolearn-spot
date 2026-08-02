import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';
import { ReferralService } from './ReferralService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export class AmbassadorService {
  /**
   * Apply for Campus Ambassador program
   */
  static async applyForAmbassador(params: {
    userId: string;
    userEmail: string;
    userName: string;
    phone: string;
    institution: string;
    campusLocation: string;
    studentId?: string;
    levelOfStudy?: string;
    courseOfStudy?: string;
    graduationYear?: number;
    motivation: string;
    marketingPlan?: string;
    socialMediaLinks?: any;
  }) {
    try {
      // Check if already applied
      const { data: existingApp } = await supabaseAdmin
        .from('ambassador_applications')
        .select('id, status')
        .eq('user_id', params.userId)
        .in('status', ['pending', 'approved'])
        .single();

      if (existingApp) {
        if (existingApp.status === 'approved') return { success: false, error: 'You are already an ambassador' };
        return { success: false, error: 'You already have a pending application' };
      }

      const { data, error } = await supabaseAdmin
        .from('ambassador_applications')
        .insert({
          user_id: params.userId,
          user_email: params.userEmail,
          user_name: params.userName,
          phone: params.phone,
          institution: params.institution,
          campus_location: params.campusLocation,
          student_id: params.studentId,
          level_of_study: params.levelOfStudy,
          course_of_study: params.courseOfStudy,
          graduation_year: params.graduationYear,
          motivation: params.motivation,
          marketing_plan: params.marketingPlan,
          social_media_links: params.socialMediaLinks,
          status: 'pending'
        })
        .select()
        .single();

      if (error || !data) return { success: false, error: 'Failed to submit application' };

      await logReferralEvent({
        action: 'ambassador_application_submitted',
        category: 'application_submission',
        user_id: params.userId,
        description: 'New campus ambassador application submitted',
        metadata: { applicationId: data.id }
      });

      return { success: true, application: data };
    } catch (err) {
      console.error('[AmbassadorService] applyForAmbassador err:', err);
      return { success: false, error: 'Internal Server Error' };
    }
  }

  /**
   * Process Ambassador Application (Approve or Reject)
   */
  static async processApplication(params: {
    applicationId: string;
    action: 'approve' | 'reject';
    adminId: string;
    notes?: string;
  }) {
    try {
      const { data: application, error: fetchErr } = await supabaseAdmin
        .from('ambassador_applications')
        .select('*')
        .eq('id', params.applicationId)
        .single();

      if (fetchErr || !application) return { success: false, error: 'Application not found' };
      if (application.status !== 'pending') return { success: false, error: 'Application is already processed' };

      const now = new Date().toISOString();
      const status = params.action === 'approve' ? 'approved' : 'rejected';

      // Update application
      const { error: updateErr } = await supabaseAdmin
        .from('ambassador_applications')
        .update({
          status,
          admin_notes: params.notes,
          reviewed_by: params.adminId,
          reviewed_at: now,
          updated_at: now
        })
        .eq('id', params.applicationId);

      if (updateErr) return { success: false, error: 'Failed to update application' };

      if (params.action === 'approve') {
        // Generate or get referral code
        let referralCodeData = await ReferralService.getOrCreateReferralCode(application.user_id);

        // Create ambassador record
        await supabaseAdmin
          .from('ambassadors')
          .insert({
            user_id: application.user_id,
            user_email: application.user_email,
            user_name: application.user_name,
            ambassador_type: 'campus_ambassador',
            status: 'active',
            institution: application.institution,
            campus_location: application.campus_location,
            referral_code_id: referralCodeData ? referralCodeData.id : null,
          });
      }

      await logReferralEvent({
        action: `ambassador_application_${status}`,
        category: 'status_change',
        user_id: application.user_id,
        description: `Ambassador application ${status} by admin`,
        metadata: { applicationId: params.applicationId, adminId: params.adminId }
      });

      return { success: true };
    } catch (err) {
      console.error('[AmbassadorService] processApplication err:', err);
      return { success: false, error: 'Internal Server Error' };
    }
  }

  /**
   * Invite Partner Ambassador
   */
  static async invitePartner(params: {
    adminId: string;
    partnerEmail: string;
    partnerName: string;
    partnerUserId: string; // The clerk ID if known, or we assume they must register first. SRS says admin enters email/name, system creates record.
    institution?: string;
  }) {
    try {
      // Create or ensure referral code exists
      let referralCodeData = await ReferralService.getOrCreateReferralCode(params.partnerUserId);

      const { data, error } = await supabaseAdmin
        .from('ambassadors')
        .insert({
          user_id: params.partnerUserId,
          user_email: params.partnerEmail,
          user_name: params.partnerName,
          ambassador_type: 'partner_ambassador',
          status: 'active', // For simplicity, activating immediately if user exists
          institution: params.institution,
          referral_code_id: referralCodeData ? referralCodeData.id : null,
        })
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: 'Failed to create partner ambassador' };
      }

      await logReferralEvent({
        action: 'partner_ambassador_invited',
        category: 'status_change',
        user_id: params.partnerUserId,
        description: `Partner ambassador ${params.partnerEmail} invited and activated`,
        metadata: { adminId: params.adminId }
      });

      return { success: true, ambassador: data };
    } catch (err) {
      console.error('[AmbassadorService] invitePartner err:', err);
      return { success: false, error: 'Internal Server Error' };
    }
  }

  static async getAmbassadorStats(userId: string) {
    const { data } = await supabaseAdmin
      .from('ambassadors')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  }
}
