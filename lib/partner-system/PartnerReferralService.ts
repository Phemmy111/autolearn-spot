import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class PartnerReferralService {
  /**
   * Generate or retrieve referral code for a partner
   */
  static async getOrCreateReferralCode(userId: string): Promise<{ code: string; link: string } | null> {
    try {
      // First check if partner exists
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, partner_id')
        .eq('user_id', userId)
        .single();

      if (partnerError || !partner) {
        console.error('Partner not found:', partnerError);
        return null;
      }

      // Check if referral code already exists
      const { data: existingReferral, error: referralError } = await supabase
        .from('partner_referrals')
        .select('referral_code')
        .eq('partner_id', partner.id)
        .single();

      if (referralError && referralError.code !== 'PGRST116') {
        console.error('Error checking existing referral:', referralError);
        return null;
      }

      let referralCode: string;

      if (existingReferral) {
        referralCode = existingReferral.referral_code;
      } else {
        // Generate new referral code
        const { data: newReferral, error: createError } = await supabase
          .from('partner_referrals')
          .insert({
            partner_id: partner.id,
            referral_code: `REF${partner.partner_id}`,
            status: 'clicked'
          })
          .select('referral_code')
          .single();

        if (createError || !newReferral) {
          console.error('Error creating referral:', createError);
          return null;
        }

        referralCode = newReferral.referral_code;
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';
      const link = `${baseUrl}/enroll?ref=${referralCode}`;

      return { code: referralCode, link };
    } catch (error) {
      console.error('Error in getOrCreateReferralCode:', error);
      return null;
    }
  }

  /**
   * Track referral click
   */
  static async trackReferralClick(
    referralCode: string,
    ipAddress?: string,
    userAgent?: string,
    referrerUrl?: string,
    utmParams?: Record<string, string>
  ): Promise<boolean> {
    try {
      const { data: referral, error } = await supabase
        .from('partner_referrals')
        .select('id, partner_id')
        .eq('referral_code', referralCode)
        .single();

      if (error || !referral) {
        console.error('Referral not found:', error);
        return false;
      }

      // Update click count and tracking data
      const { error: updateError } = await supabase
        .from('partner_referrals')
        .update({
          click_count: (referral as any).click_count + 1,
          ip_address: ipAddress,
          user_agent: userAgent,
          referrer_url: referrerUrl,
          utm_source: utmParams?.utm_source,
          utm_medium: utmParams?.utm_medium,
          utm_campaign: utmParams?.utm_campaign,
          utm_term: utmParams?.utm_term,
          utm_content: utmParams?.utm_content,
          first_clicked_at: (referral as any).first_clicked_at || new Date().toISOString()
        })
        .eq('id', referral.id);

      if (updateError) {
        console.error('Error tracking click:', updateError);
        return false;
      }

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: referral.partner_id,
        activity_type: 'referral_click',
        activity_data: {
          referral_code: referralCode,
          ip_address: ipAddress,
          referrer_url: referrerUrl
        }
      });

      return true;
    } catch (error) {
      console.error('Error tracking referral click:', error);
      return false;
    }
  }

  /**
   * Register user from referral
   */
  static async registerReferralUser(
    referralCode: string,
    userId: string,
    email: string,
    name?: string
  ): Promise<boolean> {
    try {
      const { data: referral, error } = await supabase
        .from('partner_referrals')
        .select('id, partner_id')
        .eq('referral_code', referralCode)
        .single();

      if (error || !referral) {
        console.error('Referral not found:', error);
        return false;
      }

      // Update referral with user info
      const { error: updateError } = await supabase
        .from('partner_referrals')
        .update({
          referred_user_id: userId,
          referred_email: email,
          referred_name: name,
          status: 'registered',
          registered_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      if (updateError) {
        console.error('Error registering referral:', updateError);
        return false;
      }

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: referral.partner_id,
        activity_type: 'referral_registration',
        activity_data: {
          referral_code: referralCode,
          user_id: userId,
          email: email
        }
      });

      return true;
    } catch (error) {
      console.error('Error registering referral user:', error);
      return false;
    }
  }

  /**
   * Record enrollment from referral
   */
  static async recordReferralEnrollment(
    referralCode: string,
    enrollmentId: string,
    amount: number
  ): Promise<boolean> {
    try {
      const { data: referral, error } = await supabase
        .from('partner_referrals')
        .select('id, partner_id')
        .eq('referral_code', referralCode)
        .single();

      if (error || !referral) {
        console.error('Referral not found:', error);
        return false;
      }

      // Update referral status
      const { error: updateError } = await supabase
        .from('partner_referrals')
        .update({
          status: 'enrolled',
          enrolled_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      if (updateError) {
        console.error('Error recording enrollment:', updateError);
        return false;
      }

      // Update partner referral counts
      await supabase
        .from('partners')
        .update({
          total_referrals: (await supabase.from('partners').select('total_referrals').eq('id', referral.partner_id).single()).data?.total_referrals || 0 + 1,
          successful_referrals: (await supabase.from('partners').select('successful_referrals').eq('id', referral.partner_id).single()).data?.successful_referrals || 0 + 1
        })
        .eq('id', referral.partner_id);

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: referral.partner_id,
        activity_type: 'referral_enrollment',
        activity_data: {
          referral_code: referralCode,
          enrollment_id: enrollmentId,
          amount: amount
        }
      });

      return true;
    } catch (error) {
      console.error('Error recording referral enrollment:', error);
      return false;
    }
  }

  /**
   * Get referral statistics for a partner
   */
  static async getReferralStats(partnerId: string): Promise<{
    totalClicks: number;
    totalRegistrations: number;
    totalEnrollments: number;
    conversionRate: number;
  } | null> {
    try {
      const { data: referrals, error } = await supabase
        .from('partner_referrals')
        .select('click_count, status')
        .eq('partner_id', partnerId);

      if (error) {
        console.error('Error getting referral stats:', error);
        return null;
      }

      const totalClicks = referrals?.reduce((sum, r) => sum + (r.click_count || 0), 0) || 0;
      const totalRegistrations = referrals?.filter(r => r.status === 'registered' || r.status === 'enrolled').length || 0;
      const totalEnrollments = referrals?.filter(r => r.status === 'enrolled').length || 0;
      const conversionRate = totalClicks > 0 ? (totalEnrollments / totalClicks) * 100 : 0;

      return {
        totalClicks,
        totalRegistrations,
        totalEnrollments,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.error('Error in getReferralStats:', error);
      return null;
    }
  }

  /**
   * Get referral history for a partner
   */
  static async getReferralHistory(partnerId: string): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('partner_referrals')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting referral history:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReferralHistory:', error);
      return null;
    }
  }
}