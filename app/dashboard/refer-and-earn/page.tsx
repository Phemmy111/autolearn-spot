"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Copy, CheckCircle2, Wallet, Users, MousePointerClick, DollarSign, Clock, TrendingUp, ArrowRight, Link as LinkIcon, Share2, FileText, X, CreditCard } from "lucide-react";
import Link from "next/link";

export default function StudentPartnerPage() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<'loading' | 'not_partner' | 'active'>('loading');
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchPartnerStatus();
    }
  }, [isLoaded, user]);

  const fetchPartnerStatus = async () => {
    try {
      const res = await fetch(`/api/partners/student-dashboard?userId=${user?.id}`);
      const result = await res.json();
      
      if (res.ok && result.success) {
        setStatus('active');
        setData(result.data);
      } else {
        setStatus('not_partner');
      }
    } catch (err) {
      console.error(err);
      setStatus('not_partner');
    }
  };

  const handleCopyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    try {
      const res = await fetch('/api/partners/bank-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankFormData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('Bank details saved successfully!');
        setShowBankModal(false);
        fetchPartnerStatus();
      } else {
        alert(result.error || 'Failed to save bank details');
      }
    } catch (err) {
      alert('An error occurred while saving bank details');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    
    if (!amount || amount < 5000) {
      alert('Minimum withdrawal amount is ₦5,000');
      return;
    }
    
    if (amount > (data?.stats?.availableBalance || 0)) {
      alert('Insufficient balance');
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
        alert('Withdrawal request submitted successfully!');
        setWithdrawAmount('');
        fetchPartnerStatus();
      } else {
        alert(result.error || 'Failed to submit withdrawal');
      }
    } catch (err) {
      alert('An error occurred while submitting withdrawal');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isLoaded || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111317]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  if (status === 'not_partner') {
    return (
      <div className="min-h-screen bg-[#111317] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0c0e12] border border-[#1f2229] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/10 blur-3xl rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
            
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00f0ff]/20 to-purple-500/20 flex items-center justify-center text-[#00f0ff] mx-auto mb-8 relative z-10 border border-[#00f0ff]/30">
              <Users className="h-10 w-10" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Complete Your Enrollment</h1>
            <p className="text-[#b9cacb] mb-8 max-w-lg mx-auto relative z-10 text-lg">
              The Student Partner program is automatically activated when you complete your course enrollment. Once enrolled, you'll earn ₦1,500 for every successful referral.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8 relative z-10">
              <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-6">
                <DollarSign className="h-8 w-8 text-[#00f0ff] mb-3" />
                <h3 className="font-bold mb-1">₦1,500</h3>
                <p className="text-sm text-[#b9cacb]">Per successful referral</p>
              </div>
              <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-6">
                <Clock className="h-8 w-8 text-purple-400 mb-3" />
                <h3 className="font-bold mb-1">7 Days</h3>
                <p className="text-sm text-[#b9cacb]">Commission holding period</p>
              </div>
              <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-6">
                <TrendingUp className="h-8 w-8 text-green-400 mb-3" />
                <h3 className="font-bold mb-1">Unlimited</h3>
                <p className="text-sm text-[#b9cacb]">Earning potential</p>
              </div>
            </div>
            
            <Link 
              href="/enroll"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#00f0ff] text-black font-bold rounded-xl hover:bg-white transition-colors relative z-10"
            >
              Complete Enrollment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111317] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Student Partner Dashboard</h1>
            <p className="text-[#b9cacb]">Track your referrals and earnings</p>
          </div>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#1f2229] bg-[#0c0e12] text-[#b9cacb] rounded-lg hover:border-[#00f0ff] hover:text-[#00f0ff] transition-colors"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Dashboard
          </Link>
        </div>

        {/* Referral Link Card */}
        <div className="bg-gradient-to-r from-[#00f0ff]/10 via-purple-500/10 to-transparent border border-[#00f0ff]/20 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Share2 className="h-6 w-6 text-[#00f0ff]" />
                <h2 className="text-xl font-bold">Your Referral Link</h2>
              </div>
              <p className="text-[#b9cacb] text-sm max-w-xl">
                Share this unique link with your network. When they enroll through it, you earn ₦1,500 commission after their payment is verified.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white/80 truncate flex-1 lg:w-80">
                {data?.referralLink}
              </div>
              <button 
                onClick={handleCopyLink}
                className="bg-[#00f0ff] text-black px-4 py-3 rounded-lg font-bold hover:bg-white transition-colors flex-shrink-0 flex items-center gap-2"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <LinkIcon className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold">Your Referral Code</h2>
              </div>
              <p className="text-[#b9cacb] text-sm">
                Share this 8-character code. Users can also enter it manually during enrollment.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-[#111317] border border-[#1f2229] rounded-lg px-6 py-3 font-mono text-2xl font-bold text-[#00f0ff] tracking-wider">
                {data?.referralCode}
              </div>
              <button 
                onClick={handleCopyCode}
                className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-3 rounded-lg font-bold hover:bg-purple-500/30 transition-colors flex-shrink-0 flex items-center gap-2"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <MousePointerClick className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1">Total Clicks</p>
            <h3 className="text-3xl font-bold">{data?.stats?.totalClicks || 0}</h3>
          </div>
          
          <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1">Registrations</p>
            <h3 className="text-3xl font-bold">{data?.stats?.totalRegistrations || 0}</h3>
          </div>

          <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1">Pending Earnings</p>
            <h3 className="text-3xl font-bold text-yellow-400">₦{(data?.stats?.pendingEarnings || 0).toLocaleString()}</h3>
          </div>

          <div className="bg-gradient-to-br from-[#00f0ff]/10 to-purple-500/10 border border-[#00f0ff]/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/5 blur-3xl rounded-full" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 flex items-center justify-center text-[#00f0ff]">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1 relative z-10">Available Balance</p>
            <h3 className="text-3xl font-bold text-[#00f0ff] relative z-10">₦{(data?.stats?.availableBalance || 0).toLocaleString()}</h3>
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Recent Referrals</h2>
          
          {data?.recentReferrals && data.recentReferrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f2229]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#b9cacb]">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#b9cacb]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#b9cacb]">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#b9cacb]">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentReferrals.map((referral: any, index: number) => (
                    <tr key={index} className="border-b border-[#1f2229] last:border-0">
                      <td className="py-4 px-4 text-sm">{referral.email}</td>
                      <td className="py-4 px-4 text-sm text-[#b9cacb]">
                        {new Date(referral.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          referral.status === 'completed' 
                            ? 'bg-green-500/10 text-green-400' 
                            : referral.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-semibold">
                        {referral.commission ? `₦${referral.commission.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-[#b9cacb]">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet. Start sharing your link!</p>
            </div>
          )}
        </div>

        {/* Commission History */}
        <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Commission History</h2>
          
          {data?.commissions && data.commissions.length > 0 ? (
            <div className="space-y-4">
              {data.commissions.map((commission: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-[#111317] border border-[#1f2229] rounded-xl">
                  <div>
                    <p className="font-semibold">{commission.refereeEmail}</p>
                    <p className="text-sm text-[#b9cacb]">{new Date(commission.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#00f0ff]">₦{commission.amount.toLocaleString()}</p>
                    <p className="text-xs text-[#b9cacb]">{commission.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#b9cacb]">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No commissions earned yet. Refer your first student!</p>
            </div>
          )}
        </div>

        {/* Marketing Kits */}
        <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Marketing Kits</h2>
          
          {data?.marketingResources && data.marketingResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.marketingResources.map((resource: any, index: number) => (
                <div key={index} className="bg-[#111317] border border-[#1f2229] rounded-xl p-4 hover:border-[#00f0ff]/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{resource.name}</h3>
                      <p className="text-xs text-[#b9cacb] mb-2">{resource.category}</p>
                    </div>
                    <FileText className="h-5 w-5 text-[#00f0ff] flex-shrink-0" />
                  </div>
                  {resource.description && (
                    <p className="text-xs text-[#b9cacb] mb-3 line-clamp-2">{resource.description}</p>
                  )}
                  <a
                    href={resource.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#00f0ff] hover:text-white transition-colors"
                  >
                    Download
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#b9cacb]">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No marketing kits available yet. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Bank Details Section */}
        <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-[#00f0ff]" />
              <h2 className="text-xl font-bold">Bank Details</h2>
            </div>
            <button
              onClick={() => {
                if (data?.bankProfile) {
                  setBankFormData({
                    bank_name: data.bankProfile.bank_name,
                    account_number: data.bankProfile.account_number,
                    account_name: data.bankProfile.account_name
                  });
                }
                setShowBankModal(true);
              }}
              className="bg-[#00f0ff] text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors"
            >
              {data?.bankProfile ? 'Update Bank Details' : 'Add Bank Details'}
            </button>
          </div>
          
          {data?.bankProfile ? (
            <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-[#b9cacb] mb-1">Bank Name</p>
                  <p className="font-semibold">{data.bankProfile.bank_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#b9cacb] mb-1">Account Number</p>
                  <p className="font-semibold">{data.bankProfile.account_number}</p>
                </div>
                <div>
                  <p className="text-sm text-[#b9cacb] mb-1">Account Name</p>
                  <p className="font-semibold">{data.bankProfile.account_name}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[#b9cacb]">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bank details added yet. Add your bank details to withdraw your earnings.</p>
            </div>
          )}
        </div>

        {/* Withdrawal Section */}
        <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="h-6 w-6 text-[#00f0ff]" />
            <h2 className="text-xl font-bold">Withdraw Earnings</h2>
          </div>
          
          <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#b9cacb] mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-[#00f0ff]">₦{(data?.stats?.availableBalance || 0).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#b9cacb] mb-1">Minimum Withdrawal</p>
                <p className="text-lg font-semibold">₦5,000</p>
              </div>
            </div>
            
            <form onSubmit={handleWithdraw} className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="5000"
                  max={data?.stats?.availableBalance || 0}
                  className="w-full bg-[#070B12] border border-[#1f2229] rounded-lg px-4 py-3 text-white focus:border-[#00f0ff] focus:outline-none"
                  disabled={isWithdrawing}
                />
              </div>
              <button
                type="submit"
                disabled={isWithdrawing || !data?.bankProfile}
                className="bg-[#00f0ff] text-black px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw'}
              </button>
            </form>
            
            {!data?.bankProfile && (
              <p className="text-sm text-yellow-400 mt-3">
                ⚠️ Please add your bank details first to withdraw earnings
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bank Details Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Bank Details</h3>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-[#b9cacb] hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBankDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankFormData.bank_name}
                  onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                  className="w-full bg-[#111317] border border-[#1f2229] rounded-lg px-4 py-3 text-white focus:border-[#00f0ff] focus:outline-none"
                  placeholder="e.g., Access Bank"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Account Number</label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_number}
                  onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value })}
                  className="w-full bg-[#111317] border border-[#1f2229] rounded-lg px-4 py-3 text-white focus:border-[#00f0ff] focus:outline-none"
                  placeholder="e.g., 1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Account Name</label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_name}
                  onChange={(e) => setBankFormData({ ...bankFormData, account_name: e.target.value })}
                  className="w-full bg-[#111317] border border-[#1f2229] rounded-lg px-4 py-3 text-white focus:border-[#00f0ff] focus:outline-none"
                  placeholder="e.g., John Doe"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="flex-1 border border-[#1f2229] bg-[#111317] text-[#b9cacb] px-4 py-3 rounded-lg font-medium hover:bg-[#1f2229] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBank}
                  className="flex-1 bg-[#00f0ff] text-black px-4 py-3 rounded-lg font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingBank ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}