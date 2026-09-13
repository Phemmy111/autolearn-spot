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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

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
    targetAudience, learningOutcomes, requirements, thumbnailFile, thumbnailUrl
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
    
    const finalAccessDuration = accessDurationType === 'Custom' ? Number(customAccessDuration) : Number(accessDurationType);
    const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
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
      thumbnail_url: updatedThumbnailUrl,
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
    return <div className="p-8 text-center text-neutral-500">Loading product data...</div>;
  }

  const displayThumbnail = thumbnailPreview || thumbnailUrl;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">EDIT PRODUCT</h1>
        <p className="text-neutral-500 mt-2">Update your learning product details.</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 border-b pb-2">SECTION 1: Product Information</h2>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input required placeholder="e.g. Complete Web Development Bootcamp" className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Short Description</label>
            <textarea placeholder="A catchy tagline or brief summary..." className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" rows={2} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Full Description</label>
            <textarea required placeholder="Detailed description of your product..." className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" rows={6} value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} />
            <p className="text-xs text-neutral-500 mt-1.5">Use paragraphs, bullet points, and clear formatting.</p>
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 border-b pb-2">SECTION 2: Marketplace Classification</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Product Type <span className="text-red-500">*</span></label>
              <select required className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={productType} onChange={(e) => setProductType(e.target.value)}>
                {PRODUCT_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Difficulty <span className="text-red-500">*</span></label>
              <select required className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select required className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                <option value="">[ Select a category ▾ ]</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Skill <span className="text-red-500">*</span></label>
              {category ? (
                availableSkills.length > 0 ? (
                  <select required className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={skill} onChange={(e) => setSkill(e.target.value)}>
                    <option value="">[ Select a skill ▾ ]</option>
                    {availableSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <div className="p-3 bg-neutral-100 rounded-lg text-sm text-neutral-500">No skills found for this category.</div>
                )
              ) : (
                <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-lg text-sm text-neutral-500">Select a category first</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 border-b pb-2">SECTION 3: Pricing & Access</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Price <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                  {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                </div>
                <input required type="number" min="0" step="1" className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block w-full pl-8 p-3 transition-colors shadow-sm" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Currency <span className="text-red-500">*</span></label>
              <select required className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Access Duration <span className="text-red-500">*</span></label>
              <select required className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm mb-2" value={accessDurationType} onChange={(e) => setAccessDurationType(e.target.value)}>
                {ACCESS_DURATIONS.map(d => (
                  <option key={d} value={d}>{d === 'Custom' ? 'Custom' : `${d} days`}</option>
                ))}
              </select>
              {accessDurationType === 'Custom' && (
                <div className="flex items-center gap-2">
                  <input type="number" min="1" className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-2 transition-colors shadow-sm" value={customAccessDuration} onChange={(e) => setCustomAccessDuration(e.target.value)} placeholder="Days" />
                  <span className="text-sm text-neutral-600">days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 border-b pb-2">SECTION 4: Audience & Learning Goals</h2>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Target Audience</label>
            <div className="flex flex-wrap gap-2">
              {TARGET_AUDIENCES_OPTIONS.map(aud => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => toggleTargetAudience(aud)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${targetAudience.includes(aud) ? 'bg-sky-100 border-sky-300 text-sky-800' : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50'}`}
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
                <input type="text" placeholder="e.g. Build responsive websites" className="flex-1 bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-2.5" value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOutcome())} />
                <button type="button" onClick={addOutcome} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg border border-neutral-300 transition-colors">
                  + Add
                </button>
              </div>
              <ul className="space-y-2">
                {learningOutcomes.map((outcome, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm text-neutral-700">
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
                <input type="text" placeholder="e.g. Basic computer knowledge" className="flex-1 bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-2.5" value={newRequirement} onChange={(e) => setNewRequirement(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())} />
                <button type="button" onClick={addRequirement} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg border border-neutral-300 transition-colors">
                  + Add
                </button>
              </div>
              <ul className="space-y-2">
                {requirements.map((req, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm text-neutral-700">
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
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 border-b pb-2">SECTION 5: Product Appearance</h2>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Thumbnail (Optional - replace existing)</label>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-neutral-300 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors">
              {displayThumbnail ? (
                <div className="relative">
                  <img src={displayThumbnail} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-neutral-200 shadow-sm" />
                  <button type="button" onClick={() => { setThumbnailPreview(null); setThumbnailFile(null); setThumbnailUrl(null); }} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-red-200 shadow-sm">✕</button>
                </div>
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-neutral-200 rounded-lg border border-neutral-300">
                  <span className="text-neutral-400 text-xs text-center px-2">Upload product image<br/><br/>PNG/JPG/WEBP</span>
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <input type="file" id="thumbnail" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleThumbnailChange} />
                <label htmlFor="thumbnail" className="cursor-pointer inline-flex px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
                  Choose Image
                </label>
                <p className="mt-2 text-xs text-neutral-500">Recommended size: 1280x720. Max size: 2MB.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 mt-8 border-t border-neutral-200">
          <div className="text-sm font-medium w-full sm:w-auto text-center sm:text-left">
            {saveStatus === 'saving' && <span className="text-neutral-500 flex items-center justify-center sm:justify-start gap-2"><span className="animate-spin">⟳</span> Auto-saving...</span>}
            {saveStatus === 'saved' && lastSaved && <span className="text-emerald-600">✓ Draft saved at {lastSaved.toLocaleTimeString()}</span>}
            {saveStatus === 'error' && <span className="text-red-500">Failed to auto-save. Please save manually.</span>}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button type="button" onClick={() => router.push('/author/products')} className="w-full sm:w-auto px-6 py-3 text-neutral-600 font-semibold text-sm hover:text-neutral-900 transition-colors">
              Back to Products
            </button>
            <button type="button" onClick={() => router.push(`/author/products/${id}/curriculum`)} className="w-full sm:w-auto px-6 py-3 bg-white border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
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
