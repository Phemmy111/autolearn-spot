import re

file_path = 'C:/Users/ACER/Desktop/autolearn-spot/app/author/products/[id]/edit/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add states
content = content.replace(
    'const [error, setError] = useState<string | null>(null);',
    \"\"\"const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);\"\"\"
)

# 2. Set initialLoad to false when loaded
content = content.replace(
    'setLoading(false);',
    \"\"\"setLoading(false);
        setTimeout(() => setInitialLoad(false), 1000);\"\"\"
)

# 3. Add autoSave effect
auto_save = \"\"\"
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
    
    const finalAccessDuration = accessDurationType === 'Custom' 
      ? Number(customAccessDuration) 
      : Number(accessDurationType);
      
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
      const res = await fetch(/api/author/products/, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
\"\"\"

content = content.replace('const handleCategoryChange =', auto_save + '\\n  const handleCategoryChange =')

# 4. Update the save button UI
ui_replace = \"\"\"        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 mt-8 border-t border-neutral-200">
          <div className="text-sm font-medium">
            {saveStatus === 'saving' && <span className="text-neutral-500 flex items-center gap-2"><span className="animate-spin">?</span> Auto-saving...</span>}
            {saveStatus === 'saved' && lastSaved && <span className="text-emerald-600">? Draft saved at {lastSaved.toLocaleTimeString()}</span>}
            {saveStatus === 'error' && <span className="text-red-500">Failed to auto-save. Please save manually.</span>}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button type="button" onClick={() => router.push('/author/products')} className="w-full sm:w-auto px-6 py-3 text-neutral-600 font-semibold text-sm hover:text-neutral-900 transition-colors">
              Back to Products
            </button>
            <button type="submit" disabled={submitting || saveStatus === 'saving'} className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
              {submitting ? (
                <><span className="animate-spin mr-2">?</span> Saving Changes...</>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>\"\"\"

content = re.sub(r'        {/\* ACTIONS \*/}.*?</div>\\s*</form>', ui_replace + '\\n        \\n      </form>', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
