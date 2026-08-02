import { createClient } from '@supabase/supabase-js';
import { FOUNDER_CONFIG } from '@/config/founder';
import { FounderEmailService } from './FounderEmailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Business Summary Service
 * 
 * Generates daily and weekly business summaries for the founder.
 */

class BusinessSummaryService {
  /**
   * Generate daily business summary
   */
  async generateDailySummary(): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Fetch today's metrics
      const [
        registrationsResult,
        paymentsResult,
        partnerApplicationsResult,
        approvedPartnersResult,
        referralClicksResult,
        successfulReferralsResult,
        commissionsResult,
        withdrawalsResult,
      ] = await Promise.all([
        // Today's registrations
        supabaseAdmin
          .from('users')
          .select('*')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString()),

        // Today's payments
        supabaseAdmin
          .from('pending_enrollments')
          .select('*')
          .eq('payment_status', 'completed')
          .gte('completed_at', startOfDay.toISOString())
          .lte('completed_at', endOfDay.toISOString()),

        // Today's partner applications
        supabaseAdmin
          .from('partner_applications')
          .select('*')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString()),

        // Today's approved partners
        supabaseAdmin
          .from('partners')
          .select('*')
          .eq('status', 'active')
          .gte('enrolled_at', startOfDay.toISOString())
          .lte('enrolled_at', endOfDay.toISOString()),

        // Today's referral clicks
        supabaseAdmin
          .from('referral_clicks')
          .select('*')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString()),

        // Today's successful referrals
        supabaseAdmin
          .from('commissions')
          .select('*')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString()),

        // Today's commissions
        supabaseAdmin
          .from('commissions')
          .select('amount')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString()),

        // Today's withdrawals
        supabaseAdmin
          .from('withdrawals')
          .select('*')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString()),
      ]);

      const registrations = registrationsResult.data || [];
      const payments = paymentsResult.data || [];
      const partnerApplications = partnerApplicationsResult.data || [];
      const approvedPartners = approvedPartnersResult.data || [];
      const referralClicks = referralClicksResult.data || [];
      const successfulReferrals = successfulReferralsResult.data || [];
      const commissions = commissionsResult.data || [];
      const withdrawals = withdrawalsResult.data || [];

      // Calculate totals
      const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.payment_amount, 0);
      const directEnrollments = payments.filter((p: any) => p.payment_amount === 8000).length;
      const scholarshipPayments = payments.filter((p: any) => p.payment_amount === 5000).length;
      const totalCommissions = commissions.reduce((sum: number, c: any) => sum + c.amount, 0);
      const pendingWithdrawals = withdrawals.filter((w: any) => w.status === 'pending').length;
      const paidWithdrawals = withdrawals.filter((w: any) => w.status === 'completed').length;

      // Get top referrer
      const topReferrerData = await supabaseAdmin
        .from('commissions')
        .select('referrer_id, amount')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      const referrerTotals = (topReferrerData.data || []).reduce((acc: any, curr: any) => {
        acc[curr.referrer_id] = (acc[curr.referrer_id] || 0) + curr.amount;
        return acc;
      }, {});

      const topReferrerId = Object.keys(referrerTotals).sort((a, b) => referrerTotals[b] - referrerTotals[a])[0];
      const topReferrer = topReferrerId ? await supabaseAdmin.from('partners').select('full_name').eq('id', topReferrerId).single() : null;

      // Generate email
      const subject = '📊 Daily Business Summary';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #00f0ff;">${subject} - ${new Date().toLocaleDateString()}</h2>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0;">
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Today's Registrations</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">${registrations.length}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Today's Revenue</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">₦${totalRevenue.toLocaleString()}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Direct Enrollments</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">${directEnrollments}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Scholarship Payments</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">${scholarshipPayments}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Partner Applications</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">${partnerApplications.length}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Approved Partners</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">${approvedPartners.length}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Referral Clicks</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">${referralClicks.length}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Successful Referrals</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">${successfulReferrals.length}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Commissions Generated</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">₦${totalCommissions.toLocaleString()}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Pending Withdrawals</h3>
              <p style="font-size: 24px; font-weight: bold; color: #ff9900;">${pendingWithdrawals}</p>
            </div>
            
            <div style="background: #111317; padding: 20px; border-radius: 8px;">
              <h3 style="color: #b9cacb; margin-bottom: 10px;">Paid Withdrawals</h3>
              <p style="font-size: 24px; font-weight: bold; color: #00ff00;">${paidWithdrawals}</p>
            </div>
          </div>
          
          ${topReferrer?.data ? `
          <div style="background: #111317; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #b9cacb; margin-bottom: 10px;">Top Referrer Today</h3>
            <p style="font-size: 18px; font-weight: bold; color: #00f0ff;">${topReferrer.data.full_name || 'Unknown'}</p>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px; color: #b9cacb;">Summary generated at ${new Date().toLocaleString()}</p>
        </div>
      `;

      // Send email
      await FounderEmailService.sendEmail({
        to: FOUNDER_CONFIG.email,
        subject,
        html,
      });

      console.log('Daily business summary sent successfully');
    } catch (error) {
      console.error('Failed to generate daily summary:', error);
      await FounderEmailService.sendSystemError({
        error: 'Failed to generate daily business summary',
        context: 'BusinessSummaryService.generateDailySummary',
        stackTrace: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Generate weekly business summary
   */
  async generateWeeklySummary(): Promise<void> {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek.setHours(23, 59, 59, 999);

      // Previous week for comparison
      const prevWeekStart = new Date(startOfWeek);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = new Date(endOfWeek);
      prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

      // Fetch weekly metrics
      const [
        currentWeekRegistrationsResult,
        prevWeekRegistrationsResult,
        currentWeekPaymentsResult,
        prevWeekPaymentsResult,
        currentWeekCommissionsResult,
        prevWeekCommissionsResult,
      ] = await Promise.all([
        // Current week registrations
        supabaseAdmin
          .from('users')
          .select('*')
          .gte('created_at', startOfWeek.toISOString())
          .lte('created_at', endOfWeek.toISOString()),

        // Previous week registrations
        supabaseAdmin
          .from('users')
          .select('*')
          .gte('created_at', prevWeekStart.toISOString())
          .lte('created_at', prevWeekEnd.toISOString()),

        // Current week payments
        supabaseAdmin
          .from('pending_enrollments')
          .select('*')
          .eq('payment_status', 'completed')
          .gte('completed_at', startOfWeek.toISOString())
          .lte('completed_at', endOfWeek.toISOString()),

        // Previous week payments
        supabaseAdmin
          .from('pending_enrollments')
          .select('*')
          .eq('payment_status', 'completed')
          .gte('completed_at', prevWeekStart.toISOString())
          .lte('completed_at', prevWeekEnd.toISOString()),

        // Current week commissions
        supabaseAdmin
          .from('commissions')
          .select('amount')
          .gte('created_at', startOfWeek.toISOString())
          .lte('created_at', endOfWeek.toISOString()),

        // Previous week commissions
        supabaseAdmin
          .from('commissions')
          .select('amount')
          .gte('created_at', prevWeekStart.toISOString())
          .lte('created_at', prevWeekEnd.toISOString()),
      ]);

      const currentWeekRegistrations = currentWeekRegistrationsResult.data || [];
      const prevWeekRegistrations = prevWeekRegistrationsResult.data || [];
      const currentWeekPayments = currentWeekPaymentsResult.data || [];
      const prevWeekPayments = prevWeekPaymentsResult.data || [];
      const currentWeekCommissions = currentWeekCommissionsResult.data || [];
      const prevWeekCommissions = prevWeekCommissionsResult.data || [];

      // Calculate growth
      const currentRevenue = currentWeekPayments.reduce((sum: number, p: any) => sum + p.payment_amount, 0);
      const prevRevenue = prevWeekPayments.reduce((sum: number, p: any) => sum + p.payment_amount, 0);
      const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 'N/A';

      const currentCommissions = currentWeekCommissions.reduce((sum: number, c: any) => sum + c.amount, 0);
      const prevCommissions = prevWeekCommissions.reduce((sum: number, c: any) => sum + c.amount, 0);
      const commissionsGrowth = prevCommissions > 0 ? ((currentCommissions - prevCommissions) / prevCommissions * 100).toFixed(1) : 'N/A';

      const registrationGrowth = prevWeekRegistrations.length > 0 
        ? ((currentWeekRegistrations.length - prevWeekRegistrations.length) / prevWeekRegistrations.length * 100).toFixed(1)
        : 'N/A';

      // Generate email
      const subject = '📈 Weekly Business Summary';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #00f0ff;">${subject} - Week of ${startOfWeek.toLocaleDateString()}</h2>
          
          <div style="background: #111317; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #b9cacb; margin-bottom: 20px;">Weekly Growth</h3>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
              <div>
                <p style="color: #b9cacb; font-size: 14px;">Registrations</p>
                <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">${currentWeekRegistrations.length}</p>
                <p style="font-size: 14px; color: ${parseFloat(registrationGrowth as string) >= 0 ? '#00ff00' : '#ff0000'};">
                  ${parseFloat(registrationGrowth as string) >= 0 ? '+' : ''}${registrationGrowth}% vs last week
                </p>
              </div>
              
              <div>
                <p style="color: #b9cacb; font-size: 14px;">Revenue</p>
                <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">₦${currentRevenue.toLocaleString()}</p>
                <p style="font-size: 14px; color: ${parseFloat(revenueGrowth as string) >= 0 ? '#00ff00' : '#ff0000'};">
                  ${parseFloat(revenueGrowth as string) >= 0 ? '+' : ''}${revenueGrowth}% vs last week
                </p>
              </div>
              
              <div>
                <p style="color: #b9cacb; font-size: 14px;">Commissions</p>
                <p style="font-size: 24px; font-weight: bold; color: #00f0ff;">₦${currentCommissions.toLocaleString()}</p>
                <p style="font-size: 14px; color: ${parseFloat(commissionsGrowth as string) >= 0 ? '#00ff00' : '#ff0000'};">
                  ${parseFloat(commissionsGrowth as string) >= 0 ? '+' : ''}${commissionsGrowth}% vs last week
                </p>
              </div>
            </div>
          </div>
          
          <div style="background: #111317; padding: 20px; border-radius: 8px;">
            <h3 style="color: #b9cacb; margin-bottom: 10px;">Key Metrics</h3>
            <ul style="color: #b9cacb;">
              <li>Total Registrations: ${currentWeekRegistrations.length}</li>
              <li>Total Revenue: ₦${currentRevenue.toLocaleString()}</li>
              <li>Total Commissions: ₦${currentCommissions.toLocaleString()}</li>
              <li>Average Revenue per Registration: ₦${currentWeekRegistrations.length ? (currentRevenue / currentWeekRegistrations.length).toFixed(0) : 0}</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px; color: #b9cacb;">Summary generated at ${new Date().toLocaleString()}</p>
        </div>
      `;

      // Send email
      await FounderEmailService.sendEmail({
        to: FOUNDER_CONFIG.email,
        subject,
        html,
      });

      console.log('Weekly business summary sent successfully');
    } catch (error) {
      console.error('Failed to generate weekly summary:', error);
      await FounderEmailService.sendSystemError({
        error: 'Failed to generate weekly business summary',
        context: 'BusinessSummaryService.generateWeeklySummary',
        stackTrace: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}

const businessSummaryService = new BusinessSummaryService();
export { businessSummaryService as BusinessSummaryService };