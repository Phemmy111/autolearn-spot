"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Link2, ToggleLeft, MessageSquare, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface ScholarshipSettings {
  commitmentFee: number;
  fullValue: number;
  paymentUrl: string;
  isOpen: boolean;
  generalWhatsApp: string;
  paidWhatsApp: string;
}

export function ScholarshipSettingsClient() {
  const [settings, setSettings] = useState<ScholarshipSettings>({
    commitmentFee: 5000,
    fullValue: 8000,
    paymentUrl: 'https://paystack.shop/pay/lk12tlisnj',
    isOpen: true,
    generalWhatsApp: 'https://chat.whatsapp.com/DJrJYaW3nIy74xtFnZlJM3?s=cl&p=a&ilr=1&amv=3',
    paidWhatsApp: 'https://chat.whatsapp.com/DFTf7Z8il048brWDsvxUHA?s=cl&p=a&ilr=1&amv=3',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/scholarship');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/scholarship', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setSettings(data);
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
      <div className="border border-[#1f2229] bg-[#0c0e12] rounded-lg p-6">
        <p className="text-[#b9cacb]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1f2229] bg-[#0c0e12] rounded-lg p-6">
      {message && (
        <div className={`mb-4 p-3 rounded border ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500 text-green-400'
            : 'bg-red-500/10 border-red-500 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Commitment Fee */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#dbfcff] mb-2">
            <DollarSign className="h-4 w-4" />
            Commitment Fee (₦)
          </label>
          <input
            type="number"
            value={settings.commitmentFee}
            onChange={(e) => setSettings({ ...settings, commitmentFee: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
            placeholder="5000"
          />
          <p className="text-xs text-[#5d5f63] mt-1">Amount scholarship applicants pay as commitment fee</p>
        </div>

        {/* Full Value */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#dbfcff] mb-2">
            <DollarSign className="h-4 w-4" />
            Full Course Value (₦)
          </label>
          <input
            type="number"
            value={settings.fullValue}
            onChange={(e) => setSettings({ ...settings, fullValue: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
            placeholder="8000"
          />
          <p className="text-xs text-[#5d5f63] mt-1">Original course value displayed to applicants</p>
        </div>

        {/* Payment URL */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#dbfcff] mb-2">
            <Link2 className="h-4 w-4" />
            Paystack Payment URL
          </label>
          <input
            type="url"
            value={settings.paymentUrl}
            onChange={(e) => setSettings({ ...settings, paymentUrl: e.target.value })}
            className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
            placeholder="https://paystack.shop/pay/..."
          />
          <p className="text-xs text-[#5d5f63] mt-1">Payment link sent to accepted scholarship applicants</p>
        </div>

        {/* Is Open Toggle */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#dbfcff] mb-2">
            <ToggleLeft className="h-4 w-4" />
            Scholarship Applications Open
          </label>
          <select
            value={settings.isOpen.toString()}
            onChange={(e) => setSettings({ ...settings, isOpen: e.target.value === 'true' })}
            className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="true">Open - Accepting applications</option>
            <option value="false">Closed - Not accepting applications</option>
          </select>
          <p className="text-xs text-[#5d5f63] mt-1">Master toggle to enable/disable scholarship applications</p>
        </div>

        {/* General WhatsApp */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#dbfcff] mb-2">
            <MessageSquare className="h-4 w-4" />
            General WhatsApp Group URL
          </label>
          <input
            type="url"
            value={settings.generalWhatsApp}
            onChange={(e) => setSettings({ ...settings, generalWhatsApp: e.target.value })}
            className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
            placeholder="https://chat.whatsapp.com/..."
          />
          <p className="text-xs text-[#5d5f63] mt-1">WhatsApp group for all scholarship applicants</p>
        </div>

        {/* Paid WhatsApp */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#dbfcff] mb-2">
            <MessageSquare className="h-4 w-4" />
            Paid Students WhatsApp Group URL
          </label>
          <input
            type="url"
            value={settings.paidWhatsApp}
            onChange={(e) => setSettings({ ...settings, paidWhatsApp: e.target.value })}
            className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
            placeholder="https://chat.whatsapp.com/..."
          />
          <p className="text-xs text-[#5d5f63] mt-1">WhatsApp group for paid scholarship students</p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-[#1f2229]">
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-[#00f0ff] text-[#00363a] px-6 py-2 font-mono text-sm font-semibold uppercase tracking-wider hover:bg-[#00f0ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
