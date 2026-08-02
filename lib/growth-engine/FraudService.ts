import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export class FraudService {
  /**
   * Logs a potential fraud alert for admin review.
   */
  static async flagActivity(params: {
    type: 'self_referral' | 'duplicate_email' | 'duplicate_phone' | 'duplicate_ip' | 'referral_loop' | 'excessive_fake_registrations' | 'rapid_click_abuse' | 'manual_flag';
    severity: 'low' | 'medium' | 'high';
    description: string;
    userId?: string;
    relatedEntityId?: string;
    metadata?: any;
  }) {
    try {
      await supabaseAdmin.from('fraud_alerts').insert({
        type: params.type,
        severity: params.severity,
        description: params.description,
        user_id: params.userId,
        related_entity_id: params.relatedEntityId,
        metadata: params.metadata,
        status: 'open'
      });
    } catch (err) {
      console.error('[FraudService] Failed to flag activity:', err);
    }
  }

  /**
   * Check for self-referral (referrer trying to refer themselves)
   */
  static async checkSelfReferral(referrerId: string, refereeEmail: string): Promise<boolean> {
    try {
      // Check if referee email matches referrer email
      const { data: referrerPartner } = await supabaseAdmin
        .from('partners')
        .select('email')
        .eq('id', referrerId)
        .single();

      if (referrerPartner && referrerPartner.email === refereeEmail) {
        await this.flagActivity({
          type: 'self_referral',
          severity: 'high',
          description: `Partner ${referrerId} attempted to refer their own email: ${refereeEmail}`,
          userId: referrerId,
        });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Check for duplicate email in enrollments
   */
  static async checkDuplicateEmail(email: string): Promise<boolean> {
    try {
      const { data: existingEnrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEnrollment) {
        await this.flagActivity({
          type: 'duplicate_email',
          severity: 'medium',
          description: `Duplicate enrollment attempt for email: ${email}`,
          metadata: { email }
        });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Check for rapid click abuse (same IP clicking referral link excessively)
   */
  static async checkRapidClickAbuse(ipAddress: string, referralCode: string): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { count } = await supabaseAdmin
        .from('referral_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .eq('referral_code', referralCode)
        .gte('created_at', oneHourAgo);

      // More than 20 clicks from same IP in 1 hour is suspicious
      if (count && count > 20) {
        await this.flagActivity({
          type: 'rapid_click_abuse',
          severity: 'medium',
          description: `Rapid click abuse detected from IP ${ipAddress} for referral ${referralCode}`,
          metadata: { ipAddress, referralCode, clickCount: count }
        });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Check for duplicate IP registrations (potential fake accounts)
   */
  static async checkDuplicateIp(ipAddress: string, email: string): Promise<boolean> {
    try {
      // Count enrollments from same IP in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('email, created_at')
        .gte('created_at', sevenDaysAgo);

      // This would require IP tracking in enrollments table
      // For now, we'll use referral_clicks as a proxy
      const { count: ipClickCount } = await supabaseAdmin
        .from('referral_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .gte('created_at', sevenDaysAgo);

      // More than 10 different registrations from same IP in 7 days
      if (ipClickCount && ipClickCount > 10) {
        await this.flagActivity({
          type: 'duplicate_ip',
          severity: 'high',
          description: `Suspicious activity from IP ${ipAddress}: multiple registrations detected`,
          metadata: { ipAddress, email, ipClickCount }
        });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Check for referral loops (A refers B, B refers A)
   */
  static async checkReferralLoop(referrerId: string, refereeEmail: string): Promise<boolean> {
    try {
      // Check if referee was already a referrer
      const { data: refereePartner } = await supabaseAdmin
        .from('partners')
        .select('id, email')
        .eq('email', refereeEmail)
        .single();

      if (refereePartner) {
        await this.flagActivity({
          type: 'referral_loop',
          severity: 'medium',
          description: `Potential referral loop: Partner ${referrerId} referring existing partner ${refereePartner.id}`,
          userId: referrerId,
          relatedEntityId: refereePartner.id,
          metadata: { referrerId, refereePartnerId: refereePartner.id }
        });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Run comprehensive fraud checks on a referral
   */
  static async runFraudChecks(params: {
    referrerId: string;
    refereeEmail: string;
    ipAddress?: string;
    referralCode: string;
  }): Promise<{ hasFraud: boolean; alerts: string[] }> {
    const alerts: string[] = [];
    let hasFraud = false;

    // Self-referral check
    if (await this.checkSelfReferral(params.referrerId, params.refereeEmail)) {
      alerts.push('Self-referral detected');
      hasFraud = true;
    }

    // Duplicate email check
    if (await this.checkDuplicateEmail(params.refereeEmail)) {
      alerts.push('Duplicate email detected');
      hasFraud = true;
    }

    // Referral loop check
    if (await this.checkReferralLoop(params.referrerId, params.refereeEmail)) {
      alerts.push('Referral loop detected');
      hasFraud = true;
    }

    // IP-based checks (if IP provided)
    if (params.ipAddress) {
      if (await this.checkRapidClickAbuse(params.ipAddress, params.referralCode)) {
        alerts.push('Rapid click abuse detected');
        hasFraud = true;
      }

      if (await this.checkDuplicateIp(params.ipAddress, params.refereeEmail)) {
        alerts.push('Suspicious IP activity detected');
        hasFraud = true;
      }
    }

    return { hasFraud, alerts };
  }

  /**
   * Get all fraud alerts for admin review
   */
  static async getFraudAlerts(filters?: {
    status?: 'open' | 'investigating' | 'resolved' | 'dismissed';
    severity?: 'low' | 'medium' | 'high';
    limit?: number;
  }): Promise<any[]> {
    try {
      let query = supabaseAdmin
        .from('fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[FraudService] Error fetching fraud alerts:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('[FraudService] Exception in getFraudAlerts:', error);
      return [];
    }
  }

  /**
   * Resolve a fraud alert
   */
  static async resolveFraudAlert(alertId: string, resolution: {
    status: 'resolved' | 'dismissed';
    notes?: string;
    adminId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('fraud_alerts')
        .update({
          status: resolution.status,
          resolution_notes: resolution.notes,
          resolved_by: resolution.adminId,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        return { success: false, error: 'Failed to resolve fraud alert' };
      }

      return { success: true };
    } catch (error) {
      console.error('[FraudService] Exception in resolveFraudAlert:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}
