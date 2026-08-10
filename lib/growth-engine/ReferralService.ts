import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logReferralEvent } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface ReferralCode {
  id: string;
  owner_id: string;
  code: string;
  status: 'Active' | 'Inactive';
  total_clicks: number;
  total_registrations: number;
  owner_type: 'student' | 'community' | 'influencer';
  created_at: string;
  updated_at: string;
}

export class ReferralService {
  /**
   * Lazily fetches or creates a referral code for a user.
   */
  static async getOrCreateReferralCode(ownerId: string, ownerType: 'student' | 'community' | 'influencer' = 'student'): Promise<ReferralCode | null> {
    try {
      const { data: existingCode, error: fetchError } = await supabaseAdmin
        .from('referral_codes')
        .select('*')
        .eq('owner_id', ownerId)
        .single();

      if (existingCode) {
        return existingCode as ReferralCode;
      }
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching referral code:', fetchError);
        return null;
      }

      const newCode = await this.generateUniqueCode();
      
      const { data: createdCode, error: insertError } = await supabaseAdmin
        .from('referral_codes')
        .insert({
          owner_id: ownerId, // This should be the partner.id (UUID)
          code: newCode,
          status: 'Active',
          owner_type: ownerType
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating referral code:', insertError);
        return null;
      }

      await logReferralEvent({
        action: 'referral_code_created',
        category: 'enrollment',
        user_id: ownerId,
        referral_code: newCode,
        description: `Referral code ${newCode} generated for ${ownerType} ${ownerId}`
      });

      return createdCode as ReferralCode;
    } catch (error) {
      console.error('Exception in getOrCreateReferralCode:', error);
      return null;
    }
  }

  /**
   * Validates a referral code and ensures it doesn't belong to the applicant (self-referral prevention).
   */
  static async validateAndAttribute(code: string, applicantUserId?: string): Promise<{ valid: boolean; code?: string; owner_type?: string; owner_id?: string }> {
    if (!code || code.length !== 8) return { valid: false };

    try {
      const { data, error } = await supabaseAdmin
        .from('referral_codes')
        .select('status, owner_id, owner_type')
        .eq('code', code)
        .single();

      if (error || !data) return { valid: false };
      
      if (data.status !== 'Active') return { valid: false };
      
      // Prevent self-referral
      if (applicantUserId && data.owner_id === applicantUserId) {
        return { valid: false };
      }
      
      return { valid: true, code, owner_type: data.owner_type, owner_id: data.owner_id };
    } catch (error) {
      console.error('Exception in validateAndAttribute:', error);
      return { valid: false };
    }
  }

  /**
   * Tracks a click on a referral link.
   */
  static async trackReferralClick(code: string, metadata: { ipAddress?: string; userAgent?: string; referrerUrl?: string } = {}): Promise<void> {
    try {
      const validation = await this.validateAndAttribute(code);
      if (!validation.valid) return;

      await supabaseAdmin
        .from('referral_clicks')
        .insert({
          referral_code: code,
          ip_address: metadata.ipAddress || null,
          user_agent: metadata.userAgent || null,
          referrer_url: metadata.referrerUrl || null
        });

      const { data: current } = await supabaseAdmin
        .from('referral_codes')
        .select('total_clicks')
        .eq('code', code)
        .single();
        
      if (current) {
        await supabaseAdmin
          .from('referral_codes')
          .update({ total_clicks: (current.total_clicks || 0) + 1 })
          .eq('code', code);
      }

      await logReferralEvent({
        action: 'referral_click_tracked',
        category: 'enrollment',
        referral_code: code,
        description: `Click tracked for referral code ${code}`,
        metadata
      });
    } catch (error) {
      console.error('Exception in trackReferralClick:', error);
    }
  }

  /**
   * Gets referral stats for the dashboard
   */
  static async getReferralStats(ownerId: string): Promise<{ code: string; totalClicks: number; totalRegistrations: number; ownerType: string } | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('referral_codes')
        .select('code, total_clicks, total_registrations, owner_type')
        .eq('owner_id', ownerId)
        .single();

      if (error || !data) return null;
      return { code: data.code, totalClicks: data.total_clicks, totalRegistrations: data.total_registrations, ownerType: data.owner_type };
    } catch (error) {
      console.error('Exception in getReferralStats:', error);
      return null;
    }
  }

  /**
   * Generates a unique 8-character alphanumeric referral code.
   */
  private static async generateUniqueCode(): Promise<string> {
    let code = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      const { data, error } = await supabaseAdmin
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (error && error.code === 'PGRST116') {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate a unique referral code after 5 attempts');
    }

    return code;
  }
}
