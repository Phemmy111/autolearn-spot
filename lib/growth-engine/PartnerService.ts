import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';
import { ReferralService } from './ReferralService';
import { CommunityAuthService } from './CommunityAuthService';
import { PartnerEmailService } from './PartnerEmailService';
import { NotificationService } from './NotificationService';
import { getCommissionRate } from '@/lib/commission';
import type { EventCategory } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface Partner {
  id: string;
  partner_type: 'student' | 'community' | 'influencer';
  clerk_user_id?: string;
  community_ambassador_id?: string;
  influencer_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  commission_rate: number;
  custom_commission_rate?: number;
  status: 'active' | 'suspended' | 'inactive';
  total_clicks: number;
  total_registrations: number;
  total_payments_initiated: number;
  total_successful_purchases: number;
  pending_earnings: number;
  available_earnings: number;
  lifetime_earnings: number;
  total_withdrawn: number;
  referral_code_id?: string;
  created_at: string;
  updated_at: string;
}

export class PartnerService {
  /**
   * Automatically creates a Student Partner when a student purchases the course
   */
  static async createStudentPartner(clerkUserId: string, email: string, fullName: string): Promise<{ success: boolean; partner?: Partner; error?: string }> {
    try {
      // Check if partner already exists
      const { data: existingPartner } = await supabaseAdmin
        .from('partners')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (existingPartner) {
        return { success: true, partner: existingPartner as Partner };
      }

      // Create referral code
      const referralCode = await ReferralService.getOrCreateReferralCode(clerkUserId, 'student');
      if (!referralCode) {
        return { success: false, error: 'Failed to create referral code' };
      }

      // Get current commission rate for student partners
      const commissionRate = await getCommissionRate('student');

      // Create student partner with current commission rate
      const { data: partner, error } = await supabaseAdmin
        .from('partners')
        .insert({
          partner_type: 'student',
          clerk_user_id: clerkUserId,
          full_name: fullName,
          email: email,
          commission_rate: commissionRate,
          status: 'active',
          referral_code_id: referralCode.id
        })
        .select()
        .single();

      if (error) {
        console.error('[PartnerService] Error creating student partner:', error);
        return { success: false, error: 'Failed to create student partner' };
      }

      await logReferralEvent({
        action: 'student_partner_created',
        category: 'enrollment',
        user_id: clerkUserId,
        description: `Student partner created for ${email} after course purchase`,
        metadata: { partnerId: partner.id, referralCode: referralCode.code }
      });

      return { success: true, partner: partner as Partner };
    } catch (error) {
      console.error('[PartnerService] Exception in createStudentPartner:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Processes a Community Partner application approval
   */
  static async approveCommunityPartnerApplication(applicationId: string, adminId: string): Promise<{ success: boolean; error?: string; partner?: Partner }> {
    try {
      // Get application
      const { data: application, error: appError } = await supabaseAdmin
        .from('partner_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        return { success: false, error: 'Application not found' };
      }

      if (application.status !== 'pending') {
        return { success: false, error: 'Application already processed' };
      }

      // Generate password
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = CommunityAuthService.hashPassword(randomPassword);

      // Create community ambassador
      const { data: ambassador, error: ambError } = await supabaseAdmin
        .from('community_ambassadors')
        .insert({
          email: application.email,
          password_hash: passwordHash,
          full_name: application.full_name,
          phone: application.phone,
          whatsapp: application.whatsapp,
          state: application.state,
          occupation: application.occupation,
          organization: application.organization,
          status: 'active'
        })
        .select()
        .single();

      if (ambError) {
        console.error('[PartnerService] Error creating community ambassador:', ambError);
        return { success: false, error: 'Failed to create community ambassador' };
      }

      // Create referral code
      const referralCode = await ReferralService.getOrCreateReferralCode(ambassador.id, 'community');
      if (!referralCode) {
        return { success: false, error: 'Failed to create referral code' };
      }

      // Get current commission rate for community partners
      const commissionRate = await getCommissionRate('community');

      // Create partner record
      const { data: partner, error: partnerError } = await supabaseAdmin
        .from('partners')
        .insert({
          partner_type: 'community',
          community_ambassador_id: ambassador.id,
          full_name: application.full_name,
          email: application.email,
          phone: application.phone,
          commission_rate: commissionRate,
          status: 'active',
          referral_code_id: referralCode.id
        })
        .select()
        .single();

      if (partnerError) {
        console.error('[PartnerService] Error creating partner:', partnerError);
        return { success: false, error: 'Failed to create partner record' };
      }

      // Link ambassador to partner
      await supabaseAdmin
        .from('community_ambassadors')
        .update({ partner_id: partner.id })
        .eq('id', ambassador.id);

      // Update application status
      await supabaseAdmin
        .from('partner_applications')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      await logReferralEvent({
        action: 'community_partner_approved',
        category: 'application' as EventCategory,
        user_id: adminId,
        description: `Community partner application approved for ${application.email}`,
        metadata: { 
          applicationId, 
          partnerId: partner.id, 
          ambassadorId: ambassador.id,
          temporaryPassword: randomPassword 
        }
      });

      // Send approval email with credentials
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com'}/partners/login`;
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com'}/partners/dashboard`;

      await PartnerEmailService.sendApplicationApprovedEmail(
        application.email,
        application.full_name,
        randomPassword,
        loginUrl,
        dashboardUrl,
        commissionRate // Use current commission rate
      );

      // Create welcome notification
      await NotificationService.createNotification({
        partnerId: partner.id,
        type: 'application_approved',
        title: 'Welcome to AutoLearn Spot Partners!',
        message: 'Your application has been approved. You can now start referring students and earning commissions.',
        metadata: { applicationId }
      });

      return { success: true, partner: partner as Partner };
    } catch (error) {
      console.error('[PartnerService] Exception in approveCommunityPartnerApplication:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Creates an Influencer Partner (admin action)
   */
  static async createInfluencerPartner(params: {
    adminId: string;
    fullName: string;
    email: string;
    phone: string;
    platform: string;
    followers?: string;
    category?: string;
    customCommissionRate?: number;
  }): Promise<{ success: boolean; error?: string; partner?: Partner; temporaryPassword?: string }> {
    try {
      // Generate password
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = CommunityAuthService.hashPassword(randomPassword);

      // Get commission rate: use custom if provided, otherwise use configured default
      const commissionRate = params.customCommissionRate || await getCommissionRate('influencer');

      // Create influencer
      const { data: influencer, error: infError } = await supabaseAdmin
        .from('influencers')
        .insert({
          email: params.email,
          password_hash: passwordHash,
          full_name: params.fullName,
          phone: params.phone,
          platform: params.platform,
          followers: params.followers,
          category: params.category,
          commission_rate: commissionRate,
          status: 'active',
          created_by: params.adminId
        })
        .select()
        .single();

      if (infError) {
        console.error('[PartnerService] Error creating influencer:', infError);
        return { success: false, error: 'Failed to create influencer' };
      }

      // Create referral code
      const referralCode = await ReferralService.getOrCreateReferralCode(influencer.id, 'influencer');
      if (!referralCode) {
        return { success: false, error: 'Failed to create referral code' };
      }

      // Create partner record
      const { data: partner, error: partnerError } = await supabaseAdmin
        .from('partners')
        .insert({
          partner_type: 'influencer',
          influencer_id: influencer.id,
          full_name: params.fullName,
          email: params.email,
          phone: params.phone,
          commission_rate: commissionRate,
          custom_commission_rate: params.customCommissionRate,
          status: 'active',
          referral_code_id: referralCode.id
        })
        .select()
        .single();

      if (partnerError) {
        console.error('[PartnerService] Error creating partner:', partnerError);
        return { success: false, error: 'Failed to create partner record' };
      }

      // Link influencer to partner
      await supabaseAdmin
        .from('influencers')
        .update({ partner_id: partner.id })
        .eq('id', influencer.id);

      await logReferralEvent({
        action: 'influencer_partner_created',
        category: 'admin' as EventCategory,
        user_id: params.adminId,
        description: `Influencer partner created for ${params.email}`,
        metadata: { 
          partnerId: partner.id, 
          influencerId: influencer.id,
          platform: params.platform,
          temporaryPassword: randomPassword 
        }
      });

      // Send invitation email with credentials
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com'}/partners/login`;
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com'}/partners/dashboard`;

      await PartnerEmailService.sendInfluencerInvitationEmail(
        params.email,
        params.fullName,
        randomPassword,
        loginUrl,
        dashboardUrl,
        commissionRate
      );

      // Create welcome notification
      await NotificationService.createNotification({
        partnerId: partner.id,
        type: 'influencer_invitation',
        title: 'Welcome to AutoLearn Spot Influencer Program!',
        message: 'Your influencer account has been created. You can now start referring students and earning commissions.',
        metadata: { commissionRate }
      });

      return { success: true, partner: partner as Partner, temporaryPassword: randomPassword };
    } catch (error) {
      console.error('[PartnerService] Exception in createInfluencerPartner:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Gets partner by Clerk user ID (for student partners)
   */
  static async getPartnerByClerkUserId(clerkUserId: string): Promise<Partner | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('partners')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (error || !data) return null;
      return data as Partner;
    } catch (error) {
      console.error('[PartnerService] Exception in getPartnerByClerkUserId:', error);
      return null;
    }
  }

  /**
   * Gets partner by community ambassador ID
   */
  static async getPartnerByCommunityAmbassadorId(ambassadorId: string): Promise<Partner | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('partners')
        .select('*')
        .eq('community_ambassador_id', ambassadorId)
        .single();

      if (error || !data) return null;
      return data as Partner;
    } catch (error) {
      console.error('[PartnerService] Exception in getPartnerByCommunityAmbassadorId:', error);
      return null;
    }
  }

  /**
   * Gets partner by influencer ID
   */
  static async getPartnerByInfluencerId(influencerId: string): Promise<Partner | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('partners')
        .select('*')
        .eq('influencer_id', influencerId)
        .single();

      if (error || !data) return null;
      return data as Partner;
    } catch (error) {
      console.error('[PartnerService] Exception in getPartnerByInfluencerId:', error);
      return null;
    }
  }

  /**
   * Updates partner statistics
   */
  static async updatePartnerStats(partnerId: string): Promise<void> {
    try {
      // Get referral code
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('referral_code_id')
        .eq('id', partnerId)
        .single();

      if (!partner?.referral_code_id) return;

      // Get referral code
      const { data: referralCode } = await supabaseAdmin
        .from('referral_codes')
        .select('code')
        .eq('id', partner.referral_code_id)
        .single();

      if (!referralCode) return;

      // Count clicks
      const { count: totalClicks } = await supabaseAdmin
        .from('referral_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('referral_code', referralCode.code);

      // Count registrations (this would need to be tracked separately)
      // For now, we'll use the referral_codes total_registrations
      const { data: updatedReferralCode } = await supabaseAdmin
        .from('referral_codes')
        .select('total_registrations')
        .eq('id', partner.referral_code_id)
        .single();

      // Get commission stats
      const { data: commissions } = await supabaseAdmin
        .from('commissions')
        .select('amount, status')
        .eq('referrer_id', partnerId);

      let pendingEarnings = 0;
      let availableEarnings = 0;
      let lifetimeEarnings = 0;
      let totalWithdrawn = 0;

      if (commissions) {
        for (const comm of commissions) {
          if (comm.status !== 'reversed') {
            lifetimeEarnings += comm.amount;
          }
          if (comm.status === 'pending') pendingEarnings += comm.amount;
          if (comm.status === 'available') availableEarnings += comm.amount;
          if (comm.status === 'paid') totalWithdrawn += comm.amount;
        }
      }

      // Update partner
      await supabaseAdmin
        .from('partners')
        .update({
          total_clicks: totalClicks || 0,
          total_registrations: updatedReferralCode?.total_registrations || 0,
          pending_earnings: pendingEarnings,
          available_earnings: availableEarnings,
          lifetime_earnings: lifetimeEarnings,
          total_withdrawn: totalWithdrawn
        })
        .eq('id', partnerId);
    } catch (error) {
      console.error('[PartnerService] Exception in updatePartnerStats:', error);
    }
  }

  /**
   * Lists all partners with optional filters
   */
  static async listPartners(filters?: {
    partnerType?: 'student' | 'community' | 'influencer';
    status?: 'active' | 'suspended' | 'inactive';
    search?: string;
  }): Promise<Partner[]> {
    try {
      let query = supabaseAdmin
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.partnerType) {
        query = query.eq('partner_type', filters.partnerType);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[PartnerService] Error listing partners:', error);
        return [];
      }
      return data as Partner[];
    } catch (error) {
      console.error('[PartnerService] Exception in listPartners:', error);
      return [];
    }
  }

  /**
   * Suspends or activates a partner
   */
  static async updatePartnerStatus(partnerId: string, status: 'active' | 'suspended' | 'inactive', adminId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('partners')
        .update({
          status,
          status_changed_by: adminId,
          status_changed_at: new Date().toISOString(),
          status_change_reason: reason
        })
        .eq('id', partnerId);

      if (error) {
        return { success: false, error: 'Failed to update partner status' };
      }

      await logReferralEvent({
        action: 'partner_status_updated',
        category: 'admin' as EventCategory,
        user_id: adminId,
        description: `Partner ${partnerId} status changed to ${status}`,
        metadata: { partnerId, status, reason }
      });

      return { success: true };
    } catch (error) {
      console.error('[PartnerService] Exception in updatePartnerStatus:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Updates influencer commission rate
   */
  static async updateInfluencerCommission(influencerId: string, newRate: number, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update influencer table
      const { error: infError } = await supabaseAdmin
        .from('influencers')
        .update({ commission_rate: newRate })
        .eq('id', influencerId);

      if (infError) {
        return { success: false, error: 'Failed to update influencer commission' };
      }

      // Update partner table
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('id')
        .eq('influencer_id', influencerId)
        .single();

      if (partner) {
        await supabaseAdmin
          .from('partners')
          .update({
            commission_rate: newRate,
            custom_commission_rate: newRate
          })
          .eq('id', partner.id);
      }

      await logReferralEvent({
        action: 'influencer_commission_updated',
        category: 'admin' as EventCategory,
        user_id: adminId,
        description: `Influencer ${influencerId} commission rate updated to ₦${newRate}`,
        metadata: { influencerId, newRate }
      });

      return { success: true };
    } catch (error) {
      console.error('[PartnerService] Exception in updateInfluencerCommission:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}