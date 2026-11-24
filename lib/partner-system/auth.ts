import { createClient } from '@supabase/supabase-js';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { auth, currentUser } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Resolves the authenticated partner seamlessly across:
 * 1. Standalone Affiliate session cookie (SessionService 'growth_session')
 * 2. Clerk student/user session (auth() / currentUser())
 * 
 * If a Clerk-authenticated student does not have a partner account yet,
 * it is automatically created on the fly with active status and an immediate
 * unique referral code.
 */
export async function getOrResolveAuthenticatedPartner(): Promise<any | null> {
  let partner = null;

  // 1. Check standalone growth session cookie (OTP / manual partner login)
  try {
    const session = await SessionService.getSession();
    if (session?.userId) {
      const { data: matchedPartners } = await supabaseAdmin
        .from('partners')
        .select('*')
        .or(`id.eq.${session.userId},user_id.eq.${session.userId},partner_id.eq.${session.userId}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (matchedPartners && matchedPartners.length > 0) {
        partner = matchedPartners[0];
      }
    }
  } catch (err) {
    console.warn('[partner-auth] Session check warning:', err);
  }

  // 2. Check Clerk authentication (Student Portal login)
  if (!partner) {
    try {
      const { userId } = await auth();
      if (userId) {
        // Look up by user_id or id in partners table
        const { data: matchedPartners } = await supabaseAdmin
          .from('partners')
          .select('*')
          .or(`id.eq.${userId},user_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (matchedPartners && matchedPartners.length > 0) {
          partner = matchedPartners[0];
        } else {
          // If not found by user_id, check Clerk profile & enrollments for email
          const clerkUser = await currentUser().catch(() => null);
          let userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();
          let fullName = clerkUser?.fullName || 
            [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 
            null;
          let phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber || null;

          // Also check enrollments table for student profile data
          if (!userEmail || !fullName) {
            const { data: enrollment } = await supabaseAdmin
              .from('enrollments')
              .select('email, full_name, first_name, last_name')
              .eq('clerk_user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (enrollment) {
              if (!userEmail && enrollment.email) userEmail = enrollment.email.toLowerCase().trim();
              if (!fullName && enrollment.full_name) fullName = enrollment.full_name;
              else if (!fullName && (enrollment.first_name || enrollment.last_name)) {
                fullName = [enrollment.first_name, enrollment.last_name].filter(Boolean).join(' ');
              }
            }
          }

          // Check if partner exists by email
          if (userEmail) {
            const { data: byEmail } = await supabaseAdmin
              .from('partners')
              .select('*')
              .ilike('email', userEmail)
              .order('created_at', { ascending: false })
              .limit(1);

            if (byEmail && byEmail.length > 0) {
              partner = byEmail[0];
              // Link Clerk userId if not already linked
              if (!partner.user_id) {
                await supabaseAdmin
                  .from('partners')
                  .update({ user_id: userId, updated_at: new Date().toISOString() })
                  .eq('id', partner.id);
                partner.user_id = userId;
              }
            }
          }

          // AUTO-ACTIVATION: If still no partner record exists, create one for this authenticated student!
          // Anyone accessing the student dashboard is an enrolled/authorized student.
          if (!partner) {
            console.log(`[partner-auth] Auto-activating partner profile for student ${userId}...`);
            
            // Generate unique ALS partner_id
            let partnerIdCode = `ALS${Math.floor(1000 + Math.random() * 9000)}`;
            const { data: existingCode } = await supabaseAdmin
              .from('partners')
              .select('id')
              .eq('partner_id', partnerIdCode)
              .maybeSingle();

            if (existingCode) {
              partnerIdCode = `ALS${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
            }

            const cleanName = fullName || 'Student Partner';
            const cleanEmail = userEmail || `${userId}@autolearnspot.com`;

            const { data: newPartner, error: insertErr } = await supabaseAdmin
              .from('partners')
              .insert({
                partner_id: partnerIdCode,
                user_id: userId,
                name: cleanName,
                email: cleanEmail,
                phone: phone,
                status: 'active',
                available_earnings: 0,
                total_earnings: 0,
                total_clicks: 0,
                total_registrations: 0,
              })
              .select()
              .single();

            if (insertErr) {
              console.error('[partner-auth] Error creating student partner:', insertErr);
            } else if (newPartner) {
              partner = newPartner;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[partner-auth] Clerk auth check warning:', err);
    }
  }

  // 3. Ensure a referral code always exists for this partner
  if (partner) {
    try {
      await ReferralService.getOrCreateReferralCode(partner.id, 'student');
    } catch (rcErr) {
      console.warn('[partner-auth] Referral code creation note:', rcErr);
    }

    // Try setting growth session cookie so standalone partner APIs have fast cookie access
    try {
      await SessionService.createSession(partner.id, 'community');
    } catch {
      // Ignore if headers/cookies are locked
    }
  }

  return partner;
}
