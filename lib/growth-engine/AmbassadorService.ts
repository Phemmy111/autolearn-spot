import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import { CommunityAuthService } from '@/lib/growth-engine/CommunityAuthService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate partner ID
function generatePartnerId(): string {
  const prefix = 'ALS';
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${suffix}`;
}

// Helper function to generate referral code
function generateReferralCode(): string {
  const prefix = 'REF';
  const suffix = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
  return `${prefix}${suffix}`;
}

export class AmbassadorService {
  static async processApplication(params: { applicationId: string; action: 'approve' | 'reject'; adminId: string; notes?: string }) {
    try {
      const { data: application, error: appError } = await supabaseAdmin
        .from('partner_applications')
        .select('*')
        .eq('id', params.applicationId)
        .single();
      
      if (appError || !application) {
        return { success: false, error: 'Application not found' };
      }

      if (application.status !== 'pending') {
        return { success: false, error: 'Application already processed' };
      }

      const newStatus = params.action === 'approve' ? 'approved' : 'rejected';

      const { error: updateError } = await supabaseAdmin
        .from('partner_applications')
        .update({ 
          status: newStatus, 
          reviewed_by: params.adminId, 
          reviewed_at: new Date().toISOString(),
          rejection_reason: params.notes
        })
        .eq('id', params.applicationId);

      if (updateError) {
        return { success: false, error: 'Failed to update application' };
      }

      if (newStatus === 'approved') {
        // Generate partner ID and referral code
        const partnerId = generatePartnerId();
        const referralCode = generateReferralCode();
        
        // Create partner record - only use columns that exist in the table
        const { data: partnerData, error: partnerError } = await supabaseAdmin
          .from('partners')
          .insert({
            partner_id: partnerId,
            full_name: application.full_name,
            email: application.email,
            phone: application.phone,
            whatsapp: application.whatsapp,
            state: application.state,
            occupation: application.occupation,
            partner_type: application.partner_type || 'community',
            status: 'active',
            commission_rate: application.partner_type === 'influencer' ? 2500 : 1500,
            passport_url: application.passport_url,
            organization: application.organization,
            website: application.website,
            facebook: application.facebook,
            instagram: application.instagram,
            tiktok: application.tiktok,
            linkedin: application.linkedin,
            youtube: application.youtube,
            motivation: application.motivation,
            promotion_method: application.promotion_method
          })
          .select('id')
          .single();

        if (partnerError) {
          console.error('Failed to create partner:', partnerError);
          return { success: false, error: 'Failed to create partner account' };
        }

        // Create referral record
        if (partnerData) {
          await supabaseAdmin
            .from('partner_referrals')
            .insert({
              partner_id: partnerData.id,
              referral_code: referralCode,
              status: 'clicked'
            });
        }

        // Create community ambassador account with credentials
        const temporaryPassword = Math.random().toString(36).slice(-8);
        console.log('[AmbassadorService] Creating community ambassador account for:', application.email);
        const authResult = await CommunityAuthService.createCommunityAmbassador({
          email: application.email,
          password: temporaryPassword,
          full_name: application.full_name,
          phone: application.phone
        });

        if (!authResult.success) {
          console.error('[AmbassadorService] Failed to create community ambassador account:', authResult.error);
          // Check if it's a duplicate email error
          if (authResult.error?.includes('duplicate') || authResult.error?.includes('unique')) {
            console.log('[AmbassadorService] Ambassador account might already exist, trying to update password');
            // Try to update existing account password
            const passwordHash = CommunityAuthService.hashPassword(temporaryPassword);
            const { error: updateError } = await supabaseAdmin
              .from('community_ambassadors')
              .update({ password_hash: passwordHash })
              .eq('email', application.email);
            
            if (updateError) {
              console.error('[AmbassadorService] Failed to update existing ambassador password:', updateError);
              return { success: false, error: 'Failed to create or update ambassador account' };
            }
            console.log('[AmbassadorService] Successfully updated existing ambassador password');
          } else {
            return { success: false, error: 'Failed to create ambassador account: ' + authResult.error };
          }
        } else {
          console.log('[AmbassadorService] Successfully created community ambassador account');
        }

        // Send approval email with credentials
        try {
          console.log('[AmbassadorService] Attempting to send approval email to:', application.email);
          const emailResult = await PartnerEmailService.sendApplicationApprovedEmail(
            application.email,
            application.full_name,
            temporaryPassword,
            'https://autolearn-spot.vercel.app/partners/login',
            'https://autolearn-spot.vercel.app/partners/dashboard',
            application.partner_type === 'influencer' ? 2500 : 1500
          );
          console.log('[AmbassadorService] Email send result:', emailResult);
          if (!emailResult) {
            console.error('[AmbassadorService] Email sending returned false');
          }
        } catch (emailError) {
          console.error('[AmbassadorService] Failed to send approval email:', emailError);
          // Continue anyway
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[AmbassadorService] processApplication error:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  static async inviteInfluencer(params: { adminId: string; partnerEmail: string; partnerName: string; partnerUserId: string; organization?: string }) {
    try {
      const { data, error } = await supabaseAdmin
        .from('influencers')
        .insert({
          email: params.partnerEmail,
          full_name: params.partnerName,
          password_hash: 'temp_hash_' + Date.now(), // Fake hash since we don't have password here
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Failed to invite influencer' };
      }

      return { success: true, partner: data };
    } catch (error) {
      console.error('[AmbassadorService] inviteInfluencer error:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  static async applyForPartner(params: { userId: string; userEmail: string; userName: string; phone: string; organization?: string; websiteOrSocial?: string; motivation: string; marketingPlan?: string }) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ambassador_applications')
        .insert({
          user_id: params.userId,
          email: params.userEmail,
          full_name: params.userName,
          phone: params.phone,
          reason: params.motivation,
          promotion_method: params.marketingPlan,
          social_links: params.websiteOrSocial,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Failed to submit application' };
      }

      return { success: true, application: data };
    } catch (error) {
      console.error('[AmbassadorService] applyForPartner error:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  static async getPartnerStats(userId: string) {
    // Basic implementation
    return {
      partner_type: 'Student',
      is_default: true
    };
  }
}
