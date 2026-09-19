'use client';

import { useState } from 'react';
import { Settings, Plus, Image as ImageIcon, Video, Trash2, GripVertical, Save, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase client for uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MediaSliderClient({ initialSliders, skills }: { initialSliders: any[], skills: any[] }) {
  const [sliders, setSliders] = useState(initialSliders);
  const [isUploading, setIsUploading] = useState(false);
  
  // Very basic UI for the artifact phase. Real implementation would have full CRUD forms.
  // We will expand this in the next iteration.

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Manage Sliders</h2>
          <p className="text-sm text-gray-500 mt-1">Select a target to configure its slider.</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-primary/90 transition-colors">
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
            <div key={slider.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900">
                  {slider.target_id === 'homepage' ? 'Homepage Slider' : `Skill: ${skills.find(s => s.id === slider.target_id)?.name || slider.target_id}`}
                </h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {slider.transition_style} • {slider.duration_ms / 1000}s
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{slider.slider_media?.length || 0} media items attached</p>
              
              {/* Media List Preview */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {slider.slider_media?.sort((a: any, b: any) => a.order_index - b.order_index).map((media: any) => (
                  <div key={media.id} className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {media.media_type === 'video' ? (
                      <video src={media.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={media.media_url} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1">
                      {media.media_type === 'video' ? <Video className="w-3 h-3 text-white" /> : <ImageIcon className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
