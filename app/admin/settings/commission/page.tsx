// app/admin/settings/commission/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function CommissionSettingsPage() {
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [inputRate, setInputRate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRate = async () => {
    try {
      const res = await fetch("/api/admin/settings/commission");
      const data = await res.json();
      if (typeof data.commission_rate === "number") {
        setCurrentRate(data.commission_rate);
        setInputRate(String(data.commission_rate));
      }
    } catch (e: any) {
      setError("Failed to load commission rate.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRate(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const rate = parseFloat(inputRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError("Please enter a valid percentage between 0 and 100.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commission_rate: rate }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save");
      setCurrentRate(rate);
      setSuccess(`Commission rate updated to ${rate}%. All courses have been updated immediately.`);
    } catch (e: any) {
      setError(e.message || "Failed to save commission rate.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Platform Commission Rate</h1>
      <p className="text-gray-600 text-sm mb-6">
        Set the percentage the platform retains from each course sale. This takes effect immediately
        for all new sales across every course.
      </p>

      {/* Current rate card */}
      <div className="mb-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200">
        <p className="text-xs uppercase tracking-wide font-medium text-emerald-700 mb-1">
          Current Commission Rate
        </p>
        <p className="text-4xl font-bold text-emerald-800">
          {currentRate !== null ? `${currentRate}%` : "—"}
        </p>
        <p className="text-xs text-emerald-600 mt-1">
          Authors receive <strong>{currentRate !== null ? 100 - currentRate : "—"}%</strong> of each
          sale.
        </p>
      </div>

      {/* Update form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label
            htmlFor="commission_rate"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            New Commission Rate (%)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="commission_rate"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={inputRate}
              onChange={(e) => setInputRate(e.target.value)}
              className="w-36 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
              placeholder="e.g. 10"
              required
            />
            <span className="text-gray-500 text-lg font-medium">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter a value between 0 and 100. For example, 10 means the platform keeps 10% and
            authors receive 90%.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">
            ✓ {success}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <LoadingSpinner /> : null}
            {saving ? "Saving..." : "Save Commission Rate"}
          </button>
          <button
            type="button"
            onClick={() => {
              setInputRate(String(currentRate ?? ""));
              setError(null);
              setSuccess(null);
            }}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <p className="font-semibold mb-1">How it works</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>The commission rate is applied to every course sale immediately.</li>
          <li>Author earnings = Sale price × (1 − commission rate).</li>
          <li>Changes are recorded in the admin audit log.</li>
          <li>Already-recorded sales are not retroactively adjusted.</li>
        </ul>
      </div>
    </div>
  );
}
