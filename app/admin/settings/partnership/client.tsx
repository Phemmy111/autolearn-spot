"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Save, CheckCircle, AlertCircle, Clock, Gift, ShieldCheck } from 'lucide-react';

interface PartnershipSettings {
  minWithdrawal: number;
  studentCommission: number;
  holdingPeriodDays: number;
}

export function PartnershipSettingsClient() {
  const [settings, setSettings] = useState<PartnershipSettings>({
    minWithdrawal: 1000,
    studentCommission: 1000,
    holdingPeriodDays: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/partnership');
      const data = await response.json();
      setSettings({
        minWithdrawal: data.minWithdrawal ?? 1000,
        studentCommission: data.studentCommission ?? 1000,
        holdingPeriodDays: data.holdingPeriodDays ?? 7,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load partnership settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/partnership', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Partnership & Referral settings saved successfully!' });
        setSettings({
          minWithdrawal: data.minWithdrawal ?? settings.minWithdrawal,
          studentCommission: data.studentCommission ?? settings.studentCommission,
          holdingPeriodDays: data.holdingPeriodDays ?? settings.holdingPeriodDays,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-brand-border bg-card rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Loading partnership settings...</p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card rounded-2xl p-6 sm:p-8 shadow-sm max-w-2xl">
      {message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Student Referral Commission */}
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-1.5">
            <Gift className="h-4 w-4 text-emerald-500" />
            Student Referral Commission Rate (₦)
          </label>
          <input
            type="number"
            value={settings.studentCommission}
            onChange={(e) => setSettings({ ...settings, studentCommission: parseInt(e.target.value) || 0 })}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-brand-primary"
            placeholder="1000"
            min="0"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Fixed amount in Naira earned by an enrolled student for every friend who purchases a course through their referral link.
          </p>
        </div>

        {/* Minimum Withdrawal */}
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-1.5">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            Minimum Payout Withdrawal (₦)
          </label>
          <input
            type="number"
            value={settings.minWithdrawal}
            onChange={(e) => setSettings({ ...settings, minWithdrawal: parseInt(e.target.value) || 0 })}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-brand-primary"
            placeholder="1000"
            min="100"
            max="1000000"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Minimum threshold in Naira before a student or affiliate partner can request a bank payout.
          </p>
        </div>

        {/* Holding Period */}
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-1.5">
            <Clock className="h-4 w-4 text-emerald-500" />
            Commission Holding Period (Days)
          </label>
          <input
            type="number"
            value={settings.holdingPeriodDays}
            onChange={(e) => setSettings({ ...settings, holdingPeriodDays: parseInt(e.target.value) || 0 })}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-brand-primary"
            placeholder="7"
            min="0"
            max="60"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Days a commission remains in "Pending" before moving to "Available" for bank withdrawal (protects against chargebacks/refunds).
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Changes apply in real-time across all student dashboards
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
