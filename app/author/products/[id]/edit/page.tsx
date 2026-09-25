"use client";
import { useEffect, useState, use } from 'react';
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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // SECTION 1
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  
  // SECTION 2
  const [productType, setProductType] = useState('COURSE');
  const [category, setCategory] = useState('');
  const [skill, setSkill] = useState('');
  const [difficulty, setDifficulty] = useState('All Levels');
  
  // SECTION 3
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('NGN');
  const [accessDurationType, setAccessDurationType] = useState<string | number>(30);
  const [customAccessDuration, setCustomAccessDuration] = useState('30');
  
  // SECTION 4
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
  const [newOutcome, setNewOutcome] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');
  
  // SECTION 5
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [mediaGallery, setMediaGallery] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Affiliate settings
  const [affiliateEnabled, setAffiliateEnabled] = useState(false);
  const [affiliateRate, setAffiliateRate] = useState(20);
  const [affiliateSaving, setAffiliateSaving] = useState(false);
  const [affiliateSaved, setAffiliateSaved] = useState(false);
  const [productPrice, setProductPriceForAffiliate] = useState(0);

  useEffect(() => {
    fetch(`/api/author/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.product) {
          const p = data.product;
          setTitle(p.title || '');
          setProductType(p.product_type || 'COURSE');
          setSkill(p.skill_id || '');
          setPrice(String(p.price ?? 0));
          setCurrency(p.currency || 'NGN');
          setThumbnailUrl(p.thumbnail_url || null);
          setProductPriceForAffiliate(p.price || 0);
          setAffiliateEnabled(p.affiliate_enabled || false);
          setAffiliateRate(p.affiliate_commission_rate || 20);
          
          if (p.access_duration_days) {
            if (ACCESS_DURATIONS.includes(p.access_duration_days)) {
              setAccessDurationType(p.access_duration_days);
            } else {
              setAccessDurationType('Custom');
              setCustomAccessDuration(String(p.access_duration_days));
            }
          }

          if (p.description) {
            try {
              const descData = JSON.parse(p.description);
              setShortDesc(descData.short_description || '');
              setFullDesc(descData.full_description || '');
              setCategory(descData.category || '');
              setDifficulty(descData.difficulty || 'All Levels');
              setLearningOutcomes(descData.learning_outcomes || []);
              setRequirements(descData.requirements || []);
              setTargetAudience(descData.target_audience || []);
              setMediaGallery(descData.media_gallery || []);
            } catch (e) {
              setFullDesc(p.description);
            }
          }
        }
        setLoading(false);
        setTimeout(() => setInitialLoad(false), 500);
      })
      .catch(() => {
        setError('Failed to load product.');
        setLoading(false);
      });
  }, [id]);

  const availableSkills = category && SKILLS_BY_CATEGORY[category] ? SKILLS_BY_CATEGORY[category] : [];

  useEffect(() => {
    if (loading || initialLoad || submitting) return;
    const handler = setTimeout(() => {
      autoSave();
    }, 2000);
    return () => clearTimeout(handler);
  }, [
    title, shortDesc, fullDesc, productType, category, skill, difficulty,
    price, currency, accessDurationType, customAccessDuration,
    targetAudience, learningOutcomes, requirements, thumbnailFile, thumbnailUrl, mediaGallery, mediaFiles
  ]);

  const autoSave = async () => {
    if (!title.trim() || !category || !skill || Number(price) < 0) return;
    setSaveStatus('saving');
    
    let updatedThumbnailUrl = thumbnailUrl;
    if (thumbnailFile) {
      try {
        updatedThumbnailUrl = await uploadThumbnail(thumbnailFile);
        if (updatedThumbnailUrl) {
          setThumbnailUrl(updatedThumbnailUrl);
          setThumbnailFile(null);
          setThumbnailPreview(null);
        }
      } catch (err) {
        setSaveStatus('error');
        return;
      }
    }
    
    let updatedMediaGallery = [...mediaGallery];
    if (mediaFiles.length > 0) {
      try {
        const newUrls = await Promise.all(mediaFiles.map(file => uploadThumbnail(file)));
        const validUrls = newUrls.filter(Boolean) as string[];
        updatedMediaGallery = [...updatedMediaGallery, ...validUrls];
        setMediaGallery(updatedMediaGallery);
        setMediaFiles([]);
      } catch (e) {
        console.error('Failed to upload additional media');
      }
    }
    
    const finalAccessDuration = accessDurationType === 'Custom' ? Number(customAccessDuration) : Number(accessDurationType);
    const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const structuredDescription = JSON.stringify({
      short_description: shortDesc,
      full_description: fullDesc,
      category,
      difficulty,
      learning_outcomes: learningOutcomes,
      requirements,
      target_audience: targetAudience,
      media_gallery: updatedMediaGallery
    });

    const payload = {
      title, slug: generatedSlug, description: structuredDescription,
      product_type: productType, skill_id: skill, price: Number(price),
      currency, access_duration_days: finalAccessDuration, thumbnail_url: updatedThumbnailUrl,
    };

    try {
      const res = await fetch(`/api/author/products/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setLastSaved(new Date());
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setSkill(''); 
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


  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeMediaGalleryItem = (index: number) => {
    setMediaGallery(prev => prev.filter((_, i) => i !== index));
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
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
    let updatedThumbnailUrl = thumbnailUrl;
    if (thumbnailFile) {
      try {
        updatedThumbnailUrl = await uploadThumbnail(thumbnailFile);
      } catch (err) {
        setSubmitting(false);
        return setError('Failed to upload thumbnail.');
      }
    }
    
    let updatedMediaGallery = [...mediaGallery];
    if (mediaFiles.length > 0) {
      try {
        const newUrls = await Promise.all(mediaFiles.map(file => uploadThumbnail(file)));
        const validUrls = newUrls.filter(Boolean) as string[];
        updatedMediaGallery = [...updatedMediaGallery, ...validUrls];
        setMediaGallery(updatedMediaGallery);
        setMediaFiles([]);
      } catch (e) {
        console.error('Failed to upload additional media');
      }
    }
    
    const finalAccessDuration = accessDurationType === 'Custom' 
      ? Number(customAccessDuration) 
      : Number(accessDurationType);
      
    // Generate a simple slug
    const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const structuredDescription = JSON.stringify({
      short_description: shortDesc,
      full_description: fullDesc,
      category,
      difficulty,
      learning_outcomes: learningOutcomes,
      requirements,
      target_audience: targetAudience,
      media_gallery: updatedMediaGallery
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
      thumbnail_url: updatedThumbnailUrl,
      affiliate_enabled: affiliateEnabled,
      affiliate_commission_rate: affiliateRate,
    };

    try {
      const res = await fetch(`/api/author/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update product');
      } else {
        router.push('/author/products');
      }
    } catch (err) {
      setError('Network error during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-brand-text/60">Loading product data...</div>;
  }

  const displayThumbnail = thumbnailPreview || thumbnailUrl;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text">EDIT PRODUCT</h1>
        <p className="text-brand-text/60 mt-2">Update your learning product details.</p>
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
                {PRODUCT_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Difficulty <span className="text-red-500">*</span></label>
              <select required className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select required className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                <option value="">[ Select a category ▾ ]</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Skill <span className="text-red-500">*</span></label>
              {category ? (
                availableSkills.length > 0 ? (
                  <select required className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={skill} onChange={(e) => setSkill(e.target.value)}>
                    <option value="">[ Select a skill ▾ ]</option>
                    {availableSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <div className="p-3 bg-[var(--card)] brightness-95 rounded-lg text-sm text-brand-text/60">No skills found for this category.</div>
                )
              ) : (
                <div className="p-3 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text/60">Select a category first</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-brand-border p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-brand-text border-b pb-2">SECTION 3: Pricing & Access</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Price <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-brand-text/60">
                  {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                </div>
                <input required type="number" min="0" step="1" className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block w-full pl-8 p-3 transition-colors shadow-sm" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Currency <span className="text-red-500">*</span></label>
              <select required className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Access Duration <span className="text-red-500">*</span></label>
              <select required className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm mb-2" value={accessDurationType} onChange={(e) => setAccessDurationType(e.target.value)}>
                {ACCESS_DURATIONS.map(d => (
                  <option key={d} value={d}>{d === 'Custom' ? 'Custom' : `${d} days`}</option>
                ))}
              </select>
              {accessDurationType === 'Custom' && (
                <div className="flex items-center gap-2">
                  <input type="number" min="1" className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-2 transition-colors shadow-sm" value={customAccessDuration} onChange={(e) => setCustomAccessDuration(e.target.value)} placeholder="Days" />
                  <span className="text-sm text-brand-text/70">days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-brand-border p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-brand-text border-b pb-2">SECTION 4: Audience & Learning Goals</h2>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Target Audience</label>
            <div className="flex flex-wrap gap-2">
              {TARGET_AUDIENCES_OPTIONS.map(aud => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => toggleTargetAudience(aud)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${targetAudience.includes(aud) ? 'bg-sky-100 border-sky-300 text-sky-800' : 'bg-[var(--card)] border-brand-border text-brand-text/70 hover:bg-brand-bg'}`}
                >
                  {aud} {targetAudience.includes(aud) && '✓'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Learning Outcomes</label>
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="e.g. Build responsive websites" className="flex-1 bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-2.5" value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOutcome())} />
                <button type="button" onClick={addOutcome} className="px-4 py-2 bg-[var(--card)] brightness-95 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg border border-brand-border transition-colors">
                  + Add
                </button>
              </div>
              <ul className="space-y-2">
                {learningOutcomes.map((outcome, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-brand-bg border border-brand-border rounded-lg p-2.5 text-sm text-neutral-700">
                    <span>{outcome}</span>
                    <button type="button" onClick={() => removeOutcome(idx)} className="text-red-500 hover:text-red-700 font-bold px-2">×</button>
                  </li>
                ))}
                {learningOutcomes.length === 0 && <li className="text-sm text-neutral-400 italic">No outcomes added yet.</li>}
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Requirements</label>
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="e.g. Basic computer knowledge" className="flex-1 bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-2.5" value={newRequirement} onChange={(e) => setNewRequirement(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())} />
                <button type="button" onClick={addRequirement} className="px-4 py-2 bg-[var(--card)] brightness-95 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg border border-brand-border transition-colors">
                  + Add
                </button>
              </div>
              <ul className="space-y-2">
                {requirements.map((req, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-brand-bg border border-brand-border rounded-lg p-2.5 text-sm text-neutral-700">
                    <span>{req}</span>
                    <button type="button" onClick={() => removeRequirement(idx)} className="text-red-500 hover:text-red-700 font-bold px-2">×</button>
                  </li>
                ))}
                {requirements.length === 0 && <li className="text-sm text-neutral-400 italic">No requirements added yet.</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 5 */}
        <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-brand-border p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-brand-text border-b pb-2">SECTION 5: Product Appearance</h2>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Thumbnail (Optional - replace existing)</label>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-brand-border rounded-xl bg-brand-bg hover:bg-[var(--card)] brightness-95 transition-colors">
              {displayThumbnail ? (
                <div className="relative">
                  <img src={displayThumbnail} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-brand-border shadow-sm" />
                  <button type="button" onClick={() => { setThumbnailPreview(null); setThumbnailFile(null); setThumbnailUrl(null); }} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-red-200 shadow-sm">✕</button>
                </div>
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-neutral-200 rounded-lg border border-brand-border">
                  <span className="text-neutral-400 text-xs text-center px-2">Upload product image<br/><br/>PNG/JPG/WEBP</span>
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <input type="file" id="thumbnail" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleThumbnailChange} />
                <label htmlFor="thumbnail" className="cursor-pointer inline-flex px-4 py-2 bg-[var(--card)] border border-brand-border text-neutral-700 text-sm font-semibold rounded-lg hover:bg-brand-bg transition-colors shadow-sm">
                  Choose Image
                </label>
                <p className="mt-2 text-xs text-brand-text/60">Recommended size: 1280x720. Max size: 2MB.</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Additional Media Gallery (Images & Short Videos)</label>
            <div className="p-6 border-2 border-dashed border-brand-border rounded-xl bg-brand-bg">
              <div className="flex flex-wrap gap-4 mb-4">
                {mediaGallery.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-brand-border group">
                    {url.match(/\.(mp4|webm)$/i) ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt={"Media " + idx} className="w-full h-full object-cover" />
                    )}
                    <button type="button" onClick={() => removeMediaGalleryItem(idx)} className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">?</button>
                  </div>
                ))}
                {mediaFiles.map((file, idx) => (
                  <div key={"file-" + idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-brand-border bg-neutral-200 flex items-center justify-center opacity-70 group">
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

        {/* AFFILIATE SETTINGS */}
        <div className="bg-[var(--card)] rounded-2xl border-2 border-brand-border p-6 sm:p-7 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <span className="text-2xl">🤝</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-brand-text text-lg">Affiliate Programme</h3>
                <p className="text-xs sm:text-sm text-brand-text/60">Allow affiliates to promote this course and earn a commission per sale</p>
              </div>
            </div>

            {/* HIGH-CONTRAST TOGGLE BUTTON */}
            <div className="flex items-center gap-3 self-start sm:self-auto bg-brand-bg/80 border border-brand-border px-4 py-2 rounded-2xl">
              <span className={`text-xs font-bold uppercase tracking-wider ${affiliateEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'}`}>
                {affiliateEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={affiliateEnabled}
                onClick={() => setAffiliateEnabled(!affiliateEnabled)}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                  affiliateEnabled
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'bg-neutral-300 border-neutral-400 dark:bg-neutral-700 dark:border-neutral-500'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    affiliateEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* COMMISSION RATE CONTROLS */}
          <div className={`space-y-6 transition-opacity ${affiliateEnabled ? 'opacity-100' : 'opacity-60'}`}>
            <div className="bg-brand-bg/70 border border-brand-border rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-sm font-bold text-brand-text">
                    Affiliate Commission Percentage
                  </label>
                  <p className="text-xs text-brand-text/60">Authors can choose any rate between 5% and 70%</p>
                </div>

                {/* Direct Number Input */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={70}
                      value={affiliateRate}
                      onChange={e => {
                        const val = Math.min(70, Math.max(5, Number(e.target.value) || 5));
                        setAffiliateRate(val);
                      }}
                      className="w-24 px-3 py-2 text-center font-bold text-base bg-[var(--card)] border-2 border-brand-primary rounded-xl text-brand-text focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-brand-primary">%</span>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min={5}
                  max={70}
                  step={1}
                  value={affiliateRate}
                  onChange={e => setAffiliateRate(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <div className="flex justify-between text-xs text-brand-text/50 font-medium px-1">
                  <span>5% (Min)</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>70% (Max)</span>
                </div>
              </div>

              {/* Preset Quick Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <span className="text-xs font-semibold text-brand-text/60 mr-1">Quick Select:</span>
                {[10, 20, 30, 40, 50, 70].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setAffiliateRate(pct)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      affiliateRate === pct
                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                        : 'bg-[var(--card)] text-brand-text/70 border-brand-border hover:border-brand-primary/50'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE FINANCIAL BREAKDOWN */}
            {(Number(price) || 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-text/60">
                  Per Sale Breakdown (Course Price: ₦{(Number(price) || 0).toLocaleString()})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-center">
                    <p className="text-xs font-semibold text-brand-text/60 mb-1">Affiliate Earns ({affiliateRate}%)</p>
                    <p className="text-xl font-extrabold text-brand-primary">
                      ₦{Math.round((Number(price) || 0) * (affiliateRate / 100)).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-500/10 border border-neutral-500/20 text-center">
                    <p className="text-xs font-semibold text-brand-text/60 mb-1">Platform Fee (10%)</p>
                    <p className="text-xl font-extrabold text-brand-text/70">
                      ₦{Math.round((Number(price) || 0) * 0.1).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-xs font-semibold text-brand-text/60 mb-1">Your Net Earnings</p>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₦{Math.max(0, Math.round((Number(price) || 0) * (1 - 0.1 - affiliateRate / 100))).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!affiliateEnabled && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                <span>ℹ️</span>
                <span>Affiliate promotion is currently <strong>Disabled</strong>. Toggle the switch above to <strong>Enabled</strong> to let affiliates generate links in the marketplace.</span>
              </div>
            )}
          </div>

          {/* SAVE BUTTON */}
          <button
            type="button"
            disabled={affiliateSaving}
            onClick={async () => {
              setAffiliateSaving(true);
              setAffiliateSaved(false);
              try {
                const res = await fetch(`/api/author/products/${id}/affiliate`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    affiliate_enabled: affiliateEnabled, 
                    affiliate_commission_rate: affiliateRate 
                  }),
                });
                if (res.ok) { 
                  setAffiliateSaved(true); 
                  setTimeout(() => setAffiliateSaved(false), 3000); 
                } else {
                  const errData = await res.json();
                  alert(errData.error || 'Failed to save affiliate settings');
                }
              } catch (err) {
                alert('An error occurred while saving affiliate settings');
              } finally { 
                setAffiliateSaving(false); 
              }
            }}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-all text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {affiliateSaving ? (
              <><span className="animate-spin">⟳</span> Saving Affiliate Settings...</>
            ) : affiliateSaved ? (
              '✓ Affiliate Settings Saved Successfully!'
            ) : (
              'Save Affiliate Settings'
            )}
          </button>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 mt-8 border-t border-brand-border">
          <div className="text-sm font-medium w-full sm:w-auto text-center sm:text-left">
            {saveStatus === 'saving' && <span className="text-brand-text/60 flex items-center justify-center sm:justify-start gap-2"><span className="animate-spin">⟳</span> Auto-saving...</span>}
            {saveStatus === 'saved' && lastSaved && <span className="text-brand-primary">✓ Draft saved at {lastSaved.toLocaleTimeString()}</span>}
            {saveStatus === 'error' && <span className="text-red-500">Failed to auto-save. Please save manually.</span>}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button type="button" onClick={() => router.push('/author/products')} className="w-full sm:w-auto px-6 py-3 text-brand-text/70 font-semibold text-sm hover:text-brand-text transition-colors">
              Back to Products
            </button>
            <button type="button" onClick={() => router.push(`/author/products/${id}/curriculum`)} className="w-full sm:w-auto px-6 py-3 bg-[var(--card)] border border-brand-border text-neutral-700 text-sm font-semibold rounded-lg hover:bg-brand-bg transition-colors shadow-sm">
              Manage Curriculum
            </button>
            <button type="submit" disabled={submitting || saveStatus === 'saving'} className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
              {submitting ? (
                <><span className="animate-spin mr-2">⟳</span> Saving...</>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
        
      </form>
    </div>
  );
}

