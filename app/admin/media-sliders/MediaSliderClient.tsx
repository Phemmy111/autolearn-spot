'use client';

import { useState } from 'react';
import { Plus, Image as ImageIcon, Video, Trash2, Save, Loader2, X } from 'lucide-react';
import { saveMediaSlider, deleteMediaSlider } from './actions';

export default function MediaSliderClient({ initialSliders, skills }: { initialSliders: any[], skills: any[] }) {
  const [sliders, setSliders] = useState(initialSliders);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [targetId, setTargetId] = useState('homepage');
  const [transitionStyle, setTransitionStyle] = useState('fade');
  const [duration, setDuration] = useState(5000);
  const [mediaItems, setMediaItems] = useState<{file?: File, url: string, type: 'image'|'video'}[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    // Validate file size before adding (Vercel limit is 4.5MB, use 3MB to be safe)
    const maxSize = 3 * 1024 * 1024; // 3MB
    const invalidFiles = Array.from(e.target.files).filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map(f => `${f.name} (${(f.size / (1024 * 1024)).toFixed(2)}MB)`).join(', ');
      alert(`The following files are too large (max 3MB): ${fileNames}\n\nPlease compress these files or use smaller images.`);
      return;
    }
    
    const newItems = Array.from(e.target.files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
    }));
    setMediaItems(prev => [...prev, ...newItems]);
  };

  const removeMedia = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const startNewSlider = () => {
    setTargetId('homepage');
    setTransitionStyle('fade');
    setDuration(5000);
    setMediaItems([]);
    setIsEditing(true);
  };

  const editSlider = (slider: any) => {
    setTargetId(slider.target_id);
    setTransitionStyle(slider.transition_style);
    setDuration(slider.duration_ms);
    setMediaItems((slider.slider_media || []).sort((a:any,b:any) => a.order_index - b.order_index).map((m: any) => ({
      url: m.media_url,
      type: m.media_type
    })));
    setIsEditing(true);
  };

  const saveSlider = async () => {
    if (mediaItems.length === 0) return alert('Please add at least one media item.');

    try {
      setIsUploading(true);
      console.log('[Client] Starting save slider process');
      console.log('[Client] Media items:', mediaItems);
      console.log('[Client] Target ID:', targetId);
      console.log('[Client] Transition style:', transitionStyle);
      console.log('[Client] Duration:', duration);

      // 1. Upload new files to Supabase Storage using dedicated API route (sequentially to avoid 413 error)
      console.log('[Client] Starting file uploads via API route (sequential)');
      const uploadedMedia = [];
      for (let idx = 0; idx < mediaItems.length; idx++) {
        const item = mediaItems[idx];
        console.log(`[Client] Processing item ${idx}:`, item);
        if (item.url.startsWith('blob:') && item.file) {
          console.log(`[Client] Uploading file ${idx}:`, item.file.name, 'size:', item.file.size);
          const formData = new FormData();
          formData.append('file', item.file);

          const response = await fetch('/api/admin/media-sliders/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          console.log(`[Client] Upload result for item ${idx}:`, result);

          if (!result.success) {
            // Check if it's a size-related error
            if (result.error?.includes('413') || result.error?.includes('size') || result.error?.includes('limit')) {
              const sizeMB = (item.file.size / (1024 * 1024)).toFixed(2);
              throw new Error(`File "${item.file.name}" is too large (${sizeMB}MB). Please use a smaller file or compress it first.`);
            }
            throw new Error(result.error || 'Upload failed');
          }
          uploadedMedia.push({ url: result.url, type: item.type, orderIndex: idx });
        } else {
          console.log(`[Client] Using existing URL for item ${idx}:`, item.url);
          uploadedMedia.push({ url: item.url, type: item.type, orderIndex: idx });
        }
      }

      console.log('[Client] All uploads completed. Uploaded media:', uploadedMedia);

      // 2. Call Server Action to update DB (only sending URLs, not files)
      console.log('[Client] Calling saveMediaSlider server action');
      const result = await saveMediaSlider({
        targetId,
        transitionStyle,
        durationMs: duration,
        media: uploadedMedia
      });

      console.log('[Client] Server action result:', result);

      if (result.success) {
        setIsEditing(false);
        // Refresh page to see new data
        window.location.reload();
      } else {
        alert('Error saving slider: ' + result.error);
      }
    } catch (error) {
      console.error('[Client] Error in saveSlider:', error);
      alert('Failed to save slider. Check console.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slider?')) return;
    const result = await deleteMediaSlider(id);
    if (result.success) {
      setSliders(prev => prev.filter(s => s.id !== id));
    } else {
      alert('Error deleting slider.');
    }
  };

  return (
    <div className="space-y-6">
      {isEditing ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Configure Slider</h2>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Page</label>
              <select 
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-brand-primary focus:ring-brand-primary"
              >
                <option value="homepage">Homepage</option>
                {skills.map(s => (
                  <option key={s.id} value={`skill:${s.id}`}>Skill: {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transition Animation</label>
              <select 
                value={transitionStyle}
                onChange={e => setTransitionStyle(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-brand-primary focus:ring-brand-primary"
              >
                <option value="fade">Fade</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="zoom">Zoom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slide Duration (ms)</label>
              <input 
                type="number"
                step="500"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-brand-primary focus:ring-brand-primary"
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Media Items (Order: Left to Right)</h3>
                <p className="text-xs text-gray-500 mt-1">Maximum file size: 3MB per file</p>
              </div>
              <label className="cursor-pointer flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Media
                <input type="file" multiple accept="image/*,video/mp4" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[160px] p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              {mediaItems.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Click "Add Media" to upload images or MP4 videos.</p>
                </div>
              ) : (
                mediaItems.map((item, idx) => (
                  <div key={idx} className="relative w-40 h-40 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                    {item.type === 'video' ? (
                      <video src={item.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.url} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 rounded-full p-1.5 backdrop-blur-sm">
                      {item.type === 'video' ? <Video className="w-3 h-3 text-white" /> : <ImageIcon className="w-3 h-3 text-white" />}
                    </div>
                    <button 
                      onClick={() => removeMedia(idx)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-1 text-center font-medium backdrop-blur-sm">
                      Slide {idx + 1}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button 
              onClick={saveSlider}
              disabled={isUploading || mediaItems.length === 0}
              className="flex items-center gap-2 bg-brand-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Slider
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Sliders</h2>
              <p className="text-sm text-gray-500 mt-1">Select a target to configure its slider.</p>
            </div>
            <button onClick={startNewSlider} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors">
              <Plus className="w-5 h-5" />
              New Slider
            </button>
          </div>

          <div className="grid gap-6">
            {sliders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No sliders created yet</p>
                <p className="text-sm text-gray-500 mt-1">Create one to get started</p>
              </div>
            ) : (
              sliders.map((slider) => (
                <div key={slider.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-brand-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 mb-2 flex items-center gap-3">
                        {slider.target_id === 'homepage' 
                          ? 'Homepage Header' 
                          : `Skill Details: ${skills.find(s => s.id === slider.target_id.split(':')[1])?.name || slider.target_id}`}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold uppercase tracking-wider">
                          {slider.transition_style}
                        </span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                          ⏱ {slider.duration_ms / 1000}s
                        </span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold uppercase tracking-wider">
                          {slider.slider_media?.length || 0} items
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => editSlider(slider)} className="text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-4 py-2 rounded-lg transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(slider.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Media List Preview */}
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {slider.slider_media?.sort((a: any, b: any) => a.order_index - b.order_index).map((media: any) => (
                      <div key={media.id} className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        {media.media_type === 'video' ? (
                          <video src={media.media_url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={media.media_url} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-1.5 left-1.5 bg-black/50 rounded-md p-1 backdrop-blur-sm">
                          {media.media_type === 'video' ? <Video className="w-3 h-3 text-white" /> : <ImageIcon className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
