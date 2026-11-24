"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  Loader2, 
  Copy, 
  CheckCircle2, 
  Wallet, 
  Users, 
  MousePointerClick, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Share2, 
  CreditCard, 
  X,
  MessageCircle,
  Building2,
  DollarSign,
  Gift
} from "lucide-react";
import Link from "next/link";

const NIGERIAN_BANKS = [
  "Access Bank",
  "GTBank (Guaranty Trust Bank)",
  "Zenith Bank",
  "First Bank of Nigeria",
  "UBA (United Bank for Africa)",
  "Opay",
  "PalmPay",
  "Kuda Bank",
  "Moniepoint MFB",
  "Stanbic IBTC Bank",
  "Fidelity Bank",
  "FCMB",
  "Sterling Bank",
  "Wema Bank / ALAT",
  "Union Bank",
  "Polaris Bank",
  "Jaiz Bank",
  "Taj Bank",
  "Other Bank"
];

export default function StudentPartnerPage() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<'loading' | 'not_partner' | 'active'>('loading');
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bank_name: 'Access Bank',
    account_number: '',
    account_name: ''
  });
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [minWithdrawal, setMinWithdrawal] = useState(1000);
  const [commissionRate, setCommissionRate] = useState(1000);
  const [holdingPeriodDays, setHoldingPeriodDays] = useState(7);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch admin partnership settings
  useEffect(() => {
    const fetchPartnershipSettings = async () => {
      try {
        const res = await fetch('/api/settings/partnership');
        const s = await res.json();
        if (res.ok) {
          if (s.minWithdrawal) setMinWithdrawal(s.minWithdrawal);
          if (s.studentCommission) setCommissionRate(s.studentCommission);
          if (s.holdingPeriodDays) setHoldingPeriodDays(s.holdingPeriodDays);
        }
      } catch (err) {
        console.warn('Failed to fetch partnership settings:', err);
      }
    };
    fetchPartnershipSettings();
  }, []);

  const fetchPartnerStatus = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/partners/student-dashboard?userId=${user.id}`);
      const result = await res.json();
      
      if (res.ok && result.success) {
        setStatus('active');
        setData(result.data);
        if (result.data?.commissionRate) setCommissionRate(result.data.commissionRate);
        if (result.data?.minWithdrawal) setMinWithdrawal(result.data.minWithdrawal);
        if (result.data?.holdingPeriodDays) setHoldingPeriodDays(result.data.holdingPeriodDays);
        if (result.data?.bankProfile) {
          setBankFormData({
            bank_name: result.data.bankProfile.bank_name || 'Access Bank',
            account_number: result.data.bankProfile.account_number || '',
            account_name: result.data.bankProfile.account_name || ''
          });
        }
      } else {
        if (result.commissionRate) setCommissionRate(result.commissionRate);
        if (result.minWithdrawal) setMinWithdrawal(result.minWithdrawal);
        if (result.holdingPeriodDays) setHoldingPeriodDays(result.holdingPeriodDays);
        setStatus('not_partner');
      }
    } catch (err) {
      console.error(err);
      setStatus('not_partner');
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchPartnerStatus();
    } else if (isLoaded && !user) {
      setStatus('not_partner');
    }
  }, [isLoaded, user]);

  const handleCopyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/partners/bank-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankFormData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setActionMessage({ type: 'success', text: 'Bank details saved successfully!' });
        setShowBankModal(false);
        fetchPartnerStatus();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Failed to save bank details' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error saving bank details' });
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    setActionMessage(null);

    if (!amount || isNaN(amount) || amount <= 0) {
      setActionMessage({ type: 'error', text: 'Please enter a valid withdrawal amount' });
      return;
    }

    if (amount < minWithdrawal) {
      setActionMessage({ type: 'error', text: `Minimum withdrawal is ₦${minWithdrawal.toLocaleString()}` });
      return;
    }

    const available = data?.stats?.availableBalance || 0;
    if (amount > available) {
      setActionMessage({ type: 'error', text: `Insufficient available balance (Available: ₦${available.toLocaleString()})` });
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/partners/student-withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setActionMessage({ 
          type: 'success', 
          text: `Withdrawal request for ₦${amount.toLocaleString()} submitted successfully! Check your email for confirmation.` 
        });
        setWithdrawAmount('');
        fetchPartnerStatus();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Failed to submit withdrawal request' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error submitting withdrawal' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isLoaded || status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  // Polished "Complete Your Enrollment" Fallback Screen for non-enrolled users
  if (status === 'not_partner') {
    return (
      <div className="py-12 px-4 max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-12 text-center shadow-xl relative overflow-hidden">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary mx-auto mb-6">
            <Gift className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <span>Student Referral Program</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-foreground mb-3">
            Activate Your Student Referral Account
          </h1>
          
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            AutoLearn Spot students earn <strong className="text-foreground">₦{commissionRate.toLocaleString()} cash</strong> for every friend, colleague, or coursemate who enrolls using their link.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8 text-left">
            <div className="bg-muted/30 border border-border rounded-2xl p-5">
              <DollarSign className="h-7 w-7 text-emerald-500 mb-2" />
              <h3 className="font-bold text-foreground text-lg mb-0.5">₦{commissionRate.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground">Fixed payout for every verified student enrollment.</p>
            </div>
            
            <div className="bg-muted/30 border border-border rounded-2xl p-5">
              <Clock className="h-7 w-7 text-amber-500 mb-2" />
              <h3 className="font-bold text-foreground text-lg mb-0.5">{holdingPeriodDays} Days</h3>
              <p className="text-xs text-muted-foreground">Fast clearance window before funds are ready for withdrawal.</p>
            </div>
            
            <div className="bg-muted/30 border border-border rounded-2xl p-5">
              <Building2 className="h-7 w-7 text-sky-500 mb-2" />
              <h3 className="font-bold text-foreground text-lg mb-0.5">Bank Payout</h3>
              <p className="text-xs text-muted-foreground">Direct transfer into any Nigerian bank or fintech app.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href="/learning_products/c1e11cc7-d8f6-4c2d-8a3b-1bb204892921"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-2xl shadow-lg transition-all"
            >
              <span>Enroll in a Course to Activate</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link 
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-2xl transition-colors border border-border text-sm"
            >
              <span>Already Enrolled? Link Purchase</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Student Partner Dashboard
  const referralLink = data?.referralLink || '';
  const waShareText = `Hey! I'm learning practical AI Automation & tech skills on AutoLearn Spot. Watch the free preview lesson here: ${referralLink}`;

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-8">
      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in duration-300 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Gift className="w-3.5 h-3.5" />
            <span>Earn ₦{commissionRate.toLocaleString()} Per Referral</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
            Student Referral Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Share your unique referral link with coursemates and earn cash directly to your bank account.
          </p>
        </div>
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground rounded-xl text-xs font-semibold hover:bg-muted transition-colors self-start md:self-auto"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          Back to My Learning
        </Link>
      </div>

      {/* Referral Link & Share Box */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-brand-primary/5 to-transparent border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-emerald-500" />
              <h2 className="text-base sm:text-lg font-heading font-bold text-foreground">
                Your Unique Referral Link
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              When friends click your link and enroll, your ₦{commissionRate.toLocaleString()} reward is immediately logged and credited to your account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="bg-background border border-border rounded-xl px-4 py-3 font-mono text-xs sm:text-sm text-foreground truncate max-w-full lg:max-w-md select-all">
              {referralLink}
            </div>

            <button 
              onClick={handleCopyLink}
              className="px-4 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied Link!" : "Copy Link"}</span>
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(waShareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 text-center"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span>Share WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Payout</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ₦{(data?.stats?.availableBalance || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">Ready to withdraw now</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Holding</span>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            ₦{(data?.stats?.pendingEarnings || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">{holdingPeriodDays}-day holding window</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrolled Friends</span>
            <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {data?.stats?.totalRegistrations || 0}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">Successful course referrals</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link Clicks</span>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {data?.stats?.totalClicks || 0}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">Prospective students engaged</p>
        </div>
      </div>

      {/* Payout & Bank Details Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bank Details Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-heading font-bold text-foreground">Payout Bank Details</h2>
            </div>
            <button
              onClick={() => setShowBankModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
            >
              {data?.bankProfile ? 'Edit Account' : 'Add Bank Details'}
            </button>
          </div>

          {data?.bankProfile ? (
            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Bank Name</span>
                <span className="font-bold text-foreground">{data.bankProfile.bank_name}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-mono font-bold text-foreground">{data.bankProfile.account_number}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Account Name</span>
                <span className="font-bold text-foreground">{data.bankProfile.account_name}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border-2 border-dashed border-border rounded-xl">
              <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground mb-3">
                No bank account saved yet. Add your account to receive automated payout transfers.
              </p>
              <button
                onClick={() => setShowBankModal(true)}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary-hover shadow-sm transition-all"
              >
                Add Nigerian Bank Details
              </button>
            </div>
          )}
        </div>

        {/* Withdrawal Request Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-heading font-bold text-foreground">Request Bank Payout</h2>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-muted/20 mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-muted-foreground">Available to Withdraw</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                ₦{(data?.stats?.availableBalance || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border/40 pt-2">
              <span>Minimum Payout Threshold</span>
              <span className="font-semibold text-foreground">₦{minWithdrawal.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Amount (Min ₦${minWithdrawal.toLocaleString()})`}
                min={minWithdrawal}
                max={data?.stats?.availableBalance || 0}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-primary"
                disabled={isWithdrawing || !data?.bankProfile}
              />
              <button
                type="submit"
                disabled={isWithdrawing || !data?.bankProfile || (data?.stats?.availableBalance || 0) < minWithdrawal}
                className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isWithdrawing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isWithdrawing ? 'Submitting...' : 'Withdraw'}</span>
              </button>
            </div>

            {!data?.bankProfile && (
              <p className="text-xs text-amber-500">
                ⚠️ Save your bank details first before requesting payout.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Referrals & Commissions History */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Referrals */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-foreground mb-4">
            Recent Enrolled Friends
          </h2>
          
          {data?.recentReferrals && data.recentReferrals.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.recentReferrals.map((referral: any, index: number) => (
                <div key={index} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{referral.email}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(referral.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      referral.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {referral.status}
                    </span>
                    <p className="font-bold text-foreground mt-0.5">
                      {referral.commission ? `₦${referral.commission.toLocaleString()}` : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No referrals yet. Share your link to start earning!</p>
            </div>
          )}
        </div>

        {/* Commission History */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-foreground mb-4">
            Commission History
          </h2>
          
          {data?.commissions && data.commissions.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.commissions.map((comm: any, index: number) => (
                <div key={index} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{comm.refereeEmail}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(comm.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₦{comm.amount.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-muted-foreground uppercase">{comm.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No commissions logged yet. Once your friend pays, it appears here instantly.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bank Details Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-heading font-bold text-foreground">Nigerian Bank Payout Account</h3>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBankDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Select Bank <span className="text-destructive">*</span>
                </label>
                <select
                  value={bankFormData.bank_name}
                  onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-primary"
                >
                  {NIGERIAN_BANKS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Account Number (10 Digits) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={bankFormData.account_number}
                  onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-brand-primary"
                  placeholder="0123456789"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Account Holder Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_name}
                  onChange={(e) => setBankFormData({ ...bankFormData, account_name: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-primary"
                  placeholder="e.g. Femi Adeleke"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingBank}
                  className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSavingBank && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingBank ? 'Saving...' : 'Save Bank Details'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="py-3 px-4 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
