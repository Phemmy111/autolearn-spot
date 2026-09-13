'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, User as UserIcon } from 'lucide-react';
import Image from 'next/image';

export default function AuthorProfileSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    display_name: '',
    professional_title: '',
    years_of_experience: '',
    profile_image: '',
    bio: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/author/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.author) {
          setFormData({
            display_name: data.author.display_name || '',
            professional_title: data.author.professional_title || '',
            years_of_experience: data.author.years_of_experience || '',
            profile_image: data.author.profile_image || '',
            bio: data.author.bio || ''
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const payload = {
        ...formData,
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience.toString(), 10) : null
      };

      const res = await fetch('/api/author/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save profile');
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic URL placeholder handling for now, ideally connect to your image upload service
    setFormData({ ...formData, profile_image: e.target.value });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-[var(--card)] pb-20">
      <div className="border-b border-brand-border bg-brand-bg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/author/settings" className="text-brand-text/70 hover:text-brand-text">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-brand-text">Public Profile</h1>
              <p className="text-sm text-brand-text/70">Manage how you appear to students on the marketplace</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {message.text && (
          <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-brand-bg border border-brand-border rounded-2xl p-6 sm:p-8">
          
          {/* Avatar Section */}
          <div>
            <label className="block text-sm font-semibold text-brand-text mb-4">Profile Picture</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-[var(--card)] brightness-95 border-2 border-brand-border flex items-center justify-center overflow-hidden relative shrink-0">
                {formData.profile_image ? (
                  <Image src={formData.profile_image} alt="Profile" fill className="object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-brand-text/30" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  className="w-full bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text mb-2"
                  value={formData.profile_image}
                  onChange={handleImageChange}
                />
                <p className="text-xs text-brand-text/50">For best results, use an image at least 400x400px.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-brand-text mb-2">Display Name</label>
              <input
                type="text"
                required
                className="w-full bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-brand-text mb-2">Professional Title</label>
              <input
                type="text"
                placeholder="e.g. Senior Software Engineer"
                className="w-full bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text"
                value={formData.professional_title}
                onChange={(e) => setFormData({ ...formData, professional_title: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-text mb-2">Years of Experience</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 5"
              className="w-full md:w-1/2 bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text"
              value={formData.years_of_experience}
              onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-text mb-2">Track Record & Bio</label>
            <textarea
              rows={6}
              placeholder="Tell students about your background, achievements, and track record..."
              className="w-full bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text resize-none"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-brand-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
