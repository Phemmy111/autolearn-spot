"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface PartnershipSettings {
  minWithdrawal: number;
}

export function PartnershipSettingsClient() {
  const [settings, setSettings] = useState<PartnershipSettings>({
    minWithdrawal: 5000,
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
      const response = await fetch('/api/settings/partnership', {
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
        {/* Minimum Withdrawal */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#dbfcff] mb-2">
            <DollarSign className="h-4 w-4" />
            Minimum Partner Withdrawal (₦)
          </label>
          <input
            type="number"
            value={settings.minWithdrawal}
            onChange={(e) => setSettings({ ...settings, minWithdrawal: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
            placeholder="5000"
            min="0"
            max="1000000"
          />
          <p className="text-xs text-[#5d5f63] mt-1">Minimum amount partners can withdraw from their earnings</p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-[#1f2229]">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-[#00f0ff] text-[#00363a] px-4 py-2 font-mono text-sm font-semibold uppercase hover:bg-[#00f0ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
