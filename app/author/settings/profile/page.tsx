'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { uploadThumbnail } from '@/lib/supabase-upload';

export default function AuthorProfileSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    display_name: '',
    professional_title: '',
    years_of_experience: '',
    profile_image: '',
    bio: '',
    email: '',
    phone: '',
    location: '',
    linkedin_profile: '',
    website_portfolio: '',
    expertise: [] as string[]
  });
  
  const [authorId, setAuthorId] = useState<string | null>(null);

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
            bio: data.author.bio || '',
            email: data.author.email || '',
            phone: data.author.phone || '',
            location: data.author.location || '',
            linkedin_profile: data.author.linkedin_profile || '',
            website_portfolio: data.author.website_portfolio || '',
            expertise: data.author.expertise || []
          });
          setAuthorId(data.author.id);
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    setMessage({ type: '', text: '' });
    
    try {
      const publicUrl = await uploadThumbnail(file);
      if (publicUrl) {
        setFormData({ ...formData, profile_image: publicUrl });
      } else {
        setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to upload image: ' + error.message });
    } finally {
      setUploadingImage(false);
    }
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
        <div className="flex justify-end mb-4">
          {authorId && (
            <Link 
              href={`/instructors/${authorId}`} 
              className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
            >
              View Public Profile →
            </Link>
          )}
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-brand-bg border border-brand-border rounded-2xl p-6 sm:p-8" id="profile-form">
          
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
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                  className="w-full text-sm text-brand-text/70
                    file:mr-4 file:py-2.5 file:px-6
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-brand-primary file:text-primary-foreground
                    hover:file:bg-brand-primary-hover
                    focus:outline-none file:cursor-pointer disabled:opacity-50
                    mb-2"
                />
                <p className="text-xs text-brand-text/50">
                  {uploadingImage ? "Uploading image, please wait..." : "Upload a PNG or JPEG image. For best results, use an image at least 400x400px."}
                </p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-brand-text mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-brand-text mb-2">Phone</label>
              <input
                type="tel"
                placeholder="+234 8XX XXX XXXX"
                className="w-full bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-text mb-2">Location</label>
            <input
              type="text"
              placeholder="e.g. Lagos, Nigeria"
              className="w-full bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-brand-text mb-2">LinkedIn Profile</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text"
                value={formData.linkedin_profile}
                onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-brand-text mb-2">Website/Portfolio</label>
              <input
                type="url"
                placeholder="https://yourportfolio.com"
                className="w-full bg-[var(--card)] brightness-95 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-brand-text"
                value={formData.website_portfolio}
                onChange={(e) => setFormData({ ...formData, website_portfolio: e.target.value })}
              />
            </div>
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

          <div>
            <label className="block text-sm font-semibold text-brand-text mb-2">Areas of Expertise</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['AI & Automation', 'Web Development', 'Mobile Development', 'Data Science', 'Digital Marketing', 'Design & UX', 'Business', 'Other'].map((expertise) => (
                <label key={expertise} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.expertise.includes(expertise)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, expertise: [...formData.expertise, expertise] });
                      } else {
                        setFormData({ ...formData, expertise: formData.expertise.filter(e => e !== expertise) });
                      }
                    }}
                    className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-brand-text">{expertise}</span>
                </label>
              ))}
            </div>
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
