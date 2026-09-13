"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadThumbnail } from '@/lib/supabase-upload';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '@/lib/taxonomy';

const PRODUCT_TYPES = [
  { label: 'Course', value: 'COURSE' },
  { label: 'Masterclass', value: 'MASTERCLASS' },
  { label: 'E-Book', value: 'EBOOK' },
  { label: 'Webinar', value: 'WEBINAR' }
];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'];
const ACCESS_DURATIONS = [7, 14, 30, 60, 90, 180, 365, 'Custom'];
const TARGET_AUDIENCES_OPTIONS = ['Beginners', 'Students', 'Professionals', 'Entrepreneurs', 'Business Owners', 'Freelancers', 'Creators', 'Career Changers', 'Developers', 'Designers', 'Marketers'];

export default function NewProductPage() {
  const router = useRouter();
  
  // SECTION 1: Product Information
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  
  // SECTION 2: Marketplace Classification
  const [productType, setProductType] = useState('COURSE');
  const [category, setCategory] = useState('');
  const [skill, setSkill] = useState('');
  const [difficulty, setDifficulty] = useState('All Levels');
  
  // SECTION 3: Pricing & Access
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('NGN');
  const [accessDurationType, setAccessDurationType] = useState<string | number>(30);
  const [customAccessDuration, setCustomAccessDuration] = useState('30');
  
  // SECTION 4: Audience & Learning Goals
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
  const [newOutcome, setNewOutcome] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');
  
  // SECTION 5: Product Appearance
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [mediaGallery, setMediaGallery] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSkills = category && SKILLS_BY_CATEGORY[category] ? SKILLS_BY_CATEGORY[category] : [];

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setSkill(''); // Reset skill when category changes
  };

  const toggleTargetAudience = (aud: string) => {
    if (targetAudience.includes(aud)) {
      setTargetAudience(targetAudience.filter(a => a !== aud));
    } else {
      setTargetAudience([...targetAudience, aud]);
    }
  };

  const addOutcome = () => {
    if (newOutcome.trim()) {
      setLearningOutcomes([...learningOutcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  };
  
  const removeOutcome = (index: number) => {
    setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };
  
  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!title.trim()) return setError('Product title is required.');
    if (!category) return setError('Please select a category.');
    if (!skill) return setError('Please select a skill.');
    if (Number(price) < 0) return setError('Price cannot be negative.');
    
    setSubmitting(true);
    let thumbnailUrl = null;
    if (thumbnailFile) {
      try {
        thumbnailUrl = await uploadThumbnail(thumbnailFile);
      } catch (err) {
        setSubmitting(false);
        return setError('Failed to upload thumbnail.');
      }
    }
    
    const finalAccessDuration = accessDurationType === 'Custom' 
      ? Number(customAccessDuration) 
      : Number(accessDurationType);
      
    // Generate a simple slug
    const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // We package the structured data into description since the DB schema might only have description
    const structuredDescription = JSON.stringify({
      short_description: shortDesc,
      full_description: fullDesc,
      category,
      difficulty,
      learning_outcomes: learningOutcomes,
      requirements,
      target_audience: targetAudience
    });

    const payload = {
      title,
      slug: generatedSlug,
      description: structuredDescription,
      product_type: productType,
      skill_id: skill,
      price: Number(price),
      currency,
      access_duration_days: finalAccessDuration,
      thumbnail_url: thumbnailUrl,
    };

    try {
      const res = await fetch('/api/author/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Determine if the entered skill is a custom free‑text entry
      const isCustomSkill = skill && (!availableSkills || availableSkills.length === 0 || !availableSkills.some(s => s.id === skill));
      const structuredDescriptionWithCustom = isCustomSkill ? JSON.stringify({
        short_description: shortDesc,
        full_description: fullDesc,
        category,
        difficulty,
        learning_outcomes: learningOutcomes,
        requirements,
        target_audience: targetAudience,
        custom_skill: skill,
      }) : structuredDescription;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create product');
      } else {
        router.push('/author/products');
      }
    } catch (err) {
      setError('Network error during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text">CREATE NEW PRODUCT</h1>
        <p className="text-brand-text/60 mt-2">Build your learning product...</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1 */}
        <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-brand-border p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-brand-text border-b pb-2">SECTION 1: Product Information</h2>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input required placeholder="e.g. Complete Web Development Bootcamp" className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Short Description</label>
            <textarea placeholder="A catchy tagline or brief summary..." className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" rows={2} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Full Description</label>
            <textarea required placeholder="Detailed description of your product..." className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" rows={6} value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} />
            <p className="text-xs text-brand-text/60 mt-1.5">Use paragraphs, bullet points, and clear formatting.</p>
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-brand-border p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-brand-text border-b pb-2">SECTION 2: Marketplace Classification</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Product Type <span className="text-red-500">*</span></label>
              <select required className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={productType} onChange={(e) => setProductType(e.target.value)}>
                {PRODUCT_TYPES.map(pt => <option key={"file-" + idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-brand-border bg-neutral-200 flex items-center justify-center opacity-70 group">
                    <span className="text-[10px] text-center px-1 break-all text-neutral-600">{file.name}</span>
                    <button type="button" onClick={() => removeMediaFile(idx)} className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">?</button>
                  </div>
                ))}
              </div>
              <input type="file" id="additional-media" multiple accept="image/png, image/jpeg, image/webp, video/mp4, video/webm" className="hidden" onChange={handleMediaChange} />
              <label htmlFor="additional-media" className="cursor-pointer inline-flex px-4 py-2 bg-[var(--card)] border border-brand-border text-neutral-700 text-sm font-semibold rounded-lg hover:bg-brand-bg transition-colors shadow-sm">
                + Add Media
              </label>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4">
          <button type="button" onClick={() => router.push('/author/products')} className="w-full sm:w-auto px-6 py-3 text-brand-text/70 font-semibold text-sm hover:text-brand-text transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {submitting ? (
              <><span className="animate-spin mr-2">⟳</span> Saving Draft...</>
            ) : (
              'Save Draft'
            )}
          </button>
        </div>
        
      </form>
    </div>
  );
}
