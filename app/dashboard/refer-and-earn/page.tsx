'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Share2, Users, MousePointerClick, Wallet, Copy, Check, TrendingUp, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ReferralData {
  referralCode: string;
  shareUrl: string;
  totalClicks: number;
  totalRegistrations: number;
  pendingEarnings: number;
  availableEarnings: number;
}

export default function ReferAndEarnPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/referrals');
      if (!response.ok) throw new Error('Failed to fetch referral data');
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch');
      
      setData({
        referralCode: json.referralCode,
        shareUrl: json.shareUrl,
        totalClicks: json.totalClicks,
        totalRegistrations: json.totalRegistrations,
        pendingEarnings: json.pendingEarnings,
        availableEarnings: json.availableEarnings,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({
        title: "Link Copied",
        description: "Share link has been copied to your clipboard.",
      });
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({
        title: "Code Copied",
        description: "Referral code has been copied to your clipboard.",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-[#1f2229]" />
          <Skeleton className="h-4 w-96 bg-[#1f2229]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardContent className="pt-6 h-32 flex flex-col justify-center">
              <Skeleton className="h-6 w-32 bg-[#1f2229] mb-4" />
              <Skeleton className="h-10 w-full bg-[#1f2229]" />
            </CardContent>
          </Card>
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardContent className="pt-6 h-32 flex flex-col justify-center">
              <Skeleton className="h-6 w-32 bg-[#1f2229] mb-4" />
              <Skeleton className="h-10 w-full bg-[#1f2229]" />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <Skeleton className="h-4 w-24 bg-[#1f2229]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-[#1f2229]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-[#0c0e12] border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'Failed to load referral data'}</p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#3b494b] text-white hover:bg-[#1a1d24]"
              onClick={fetchReferralData}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 px-4 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Share2 className="h-8 w-8 text-[#00f0ff]" />
          Refer & Earn
        </h1>
        <p className="text-[#b9cacb]">
          Share your referral code with friends and earn commissions when they enroll.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Referral Code Card */}
        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader>
            <CardTitle className="text-white text-lg flex justify-between items-center">
              Your Referral Code
            </CardTitle>
            <CardDescription className="text-[#b9cacb]">
              Students can enter this code during registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-[#1f2229] px-4 py-3 text-2xl font-mono font-bold text-[#00f0ff] text-center border border-[#3b494b] tracking-wider">
                {data.referralCode}
              </code>
              <Button
                size="icon"
                className="h-[58px] w-[58px] bg-[#00f0ff] text-black hover:bg-[#00d0dd] shrink-0"
                onClick={() => copyToClipboard(data.referralCode, false)}
                title="Copy Code"
              >
                {copiedCode ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Link Card */}
        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader>
            <CardTitle className="text-white text-lg flex justify-between items-center">
              Your Share Link
            </CardTitle>
            <CardDescription className="text-[#b9cacb]">
              Share this direct link to auto-apply your code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded bg-[#1f2229] px-4 py-3 text-sm font-mono text-[#dbfcff] border border-[#3b494b]">
                {data.shareUrl}
              </div>
              <Button
                size="icon"
                className="h-[46px] w-[46px] border border-[#3b494b] bg-[#1a1d24] text-white hover:bg-[#252830] shrink-0"
                onClick={() => copyToClipboard(data.shareUrl, true)}
                title="Copy Link"
              >
                {copiedLink ? <Check className="h-5 w-5 text-[#00f0ff]" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-[#00f0ff]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.totalClicks}</div>
            <p className="text-xs text-[#b9cacb] mt-1">
              Visits via your link
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Registrations</CardTitle>
            <Users className="h-4 w-4 text-[#00f0ff]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.totalRegistrations}</div>
            <p className="text-xs text-[#b9cacb] mt-1">
              Successful enrollments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending Earnings</CardTitle>
            <Wallet className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{formatCurrency(data.pendingEarnings)}</div>
            <p className="text-xs text-[#b9cacb] mt-1">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0e12] border-[#1f2229] shadow-[0_0_15px_rgba(0,240,255,0.1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Available Earnings</CardTitle>
            <CreditCard className="h-4 w-4 text-[#00f0ff]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00f0ff]">{formatCurrency(data.availableEarnings)}</div>
            <p className="text-xs text-[#b9cacb] mt-1">
              Ready for withdrawal
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
