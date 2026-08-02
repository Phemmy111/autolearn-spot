import { auth, currentUser } from '@clerk/nextjs/server';
import { AmbassadorService } from '@/lib/growth-engine/AmbassadorService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import Link from 'next/link';

export default async function PartnersDashboard() {
  const { userId } = await auth();
  if (!userId) return null;

  // Make sure referral code is created if they visit here
  await ReferralService.getOrCreateReferralCode(userId);

  const partnerStats = await AmbassadorService.getPartnerStats(userId);
  const earnings = await CommissionService.getEarnings(userId);
  const referralStats = await ReferralService.getReferralStats(userId);

  const isDefault = partnerStats.is_default;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-white mb-6 font-heading">Partner Portal</h1>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-6">
          <h3 className="text-[#b9cacb] mb-2 font-mono text-sm uppercase">Partner Tier</h3>
          <div className="text-2xl text-[#00f0ff] uppercase font-bold">{partnerStats.partner_type || 'Student'}</div>
        </div>
        <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-6">
          <h3 className="text-[#b9cacb] mb-2 font-mono text-sm uppercase">Total Earnings</h3>
          <div className="text-2xl text-white font-bold">₦{earnings.availableEarnings + earnings.pendingEarnings}</div>
        </div>
        <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-6">
          <h3 className="text-[#b9cacb] mb-2 font-mono text-sm uppercase">Total Referrals</h3>
          <div className="text-2xl text-white font-bold">{referralStats?.totalRegistrations || 0}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Your Referral Link</h2>
          {referralStats ? (
             <div className="bg-[#0a0c10] p-4 rounded text-[#b9cacb] font-mono break-all border border-[#1f2229]">
               {process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com'}/register?ref={referralStats.code}
             </div>
          ) : (
             <p className="text-[#b9cacb]">Link not yet generated.</p>
          )}
        </div>

        {isDefault && (
          <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-6">
             <h2 className="text-xl font-bold text-white mb-4">Upgrade Your Tier</h2>
             <p className="text-[#b9cacb] mb-4 text-sm">
               You are currently on the Student tier (₦1,000 commission). Want to earn more? Apply to become a Community Partner!
             </p>
             <Link href="/partners/apply" className="inline-block bg-[#00f0ff] text-black px-4 py-2 rounded font-bold hover:bg-white transition-colors">
               Apply Now
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
