"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Video, UploadCloud, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface YouTubeResumableUploaderProps {
  onSuccess: (videoId: string, videoUrl: string, autoTitle?: string) => void;
  onError: (error: string) => void;
  initialTitle?: string;
  onTitleAutoDetected?: (title: string) => void;
}

export function YouTubeResumableUploader({ 
  onSuccess, 
  onError, 
  initialTitle = '', 
  onTitleAutoDetected 
}: YouTubeResumableUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState(initialTitle);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Sync if initialTitle changes and videoTitle is empty
  useEffect(() => {
    if (initialTitle && !videoTitle) {
      setVideoTitle(initialTitle);
    }
  }, [initialTitle, videoTitle]);

  const cleanFilenameToTitle = (filename: string): string => {
    // Strip extension
    let name = filename.replace(/\.[^/.]+$/, '');
    // Replace separators with spaces
    name = name.replace(/[-_+]+/g, ' ');
    // If pure digits, use a fallback
    if (/^\d+$/.test(name.trim())) {
      return initialTitle.trim() || 'Lesson Video';
    }
    // Strip leading track numbers like "01 Lesson" -> "Lesson"
    name = name.replace(/^\d+[\s.-]+/, '');
    name = name.trim();
    if (!name) return initialTitle.trim() || 'Lesson Video';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Auto-extract and set title if blank or currently default
      const autoCleaned = cleanFilenameToTitle(selectedFile.name);
      const targetTitle = (initialTitle && initialTitle.trim()) ? initialTitle.trim() : autoCleaned;
      setVideoTitle(targetTitle);

      if (onTitleAutoDetected) {
        onTitleAutoDetected(targetTitle);
      }
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setUploading(false);
      setStatusText('Upload cancelled.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const finalTitle = (videoTitle && videoTitle.trim()) 
      ? videoTitle.trim() 
      : (initialTitle && initialTitle.trim()) 
        ? initialTitle.trim() 
        : cleanFilenameToTitle(file.name);

    setUploading(true);
    setProgress(0);
    setStatusText('Requesting secure upload session...');

    try {
      // 1. Get the resumable upload URL with the lesson/video title for YouTube
      const sessionRes = await fetch('/api/author/integrations/youtube/upload-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          description: `AutoLearn Spot - ${finalTitle}\nUploaded via AutoLearn Author Studio`,
          mimeType: file.type,
          fileSize: file.size
        })
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionData.error || 'Failed to start upload session');
      }

      const { uploadUrl } = sessionData;
      setStatusText('Uploading direct to YouTube...');

      // 2. Upload in Google-standard 2.6MB chunks (multiple of 256KB)
      const CHUNK_SIZE = 10 * 1024 * 256; // 2,621,440 bytes (~2.62MB)
      const fileSize = file.size;

      const verifyWithBackend = async (retries = 4): Promise<boolean> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          setStatusText(`Finalizing upload with YouTube (step ${attempt}/${retries})...`);
          try {
            await new Promise((r) => setTimeout(r, 1500));
            const checkRes = await fetch('/api/author/integrations/youtube/upload-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uploadUrl, fileSize: file.size, title: finalTitle })
            });
            const checkData = await checkRes.json();
            if (checkData.success && checkData.videoId) {
              const videoUrl = checkData.videoUrl || `https://www.youtube.com/watch?v=${checkData.videoId}`;
              onSuccess(checkData.videoId, videoUrl, finalTitle);
              setStatusText('Successfully uploaded to YouTube!');
              setProgress(100);
              setUploading(false);
              return true;
            }
          } catch (e) {
            console.warn(`Verification attempt ${attempt} failed:`, e);
          }
        }
        return false;
      };

      const uploadChunk = (startByte: number): Promise<{ isComplete: boolean; responseData?: any }> => {
        return new Promise((resolve, reject) => {
          const endByte = Math.min(startByte + CHUNK_SIZE, fileSize) - 1;
          const chunk = file.slice(startByte, endByte + 1);

          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.upload.onprogress = (event) => {
            const currentChunkLoaded = event.loaded || 0;
            const totalLoaded = Math.min(fileSize, startByte + currentChunkLoaded);
            const totalPercent = Math.min(99, Math.round((totalLoaded / fileSize) * 100));
            setProgress(totalPercent);

            const loadedMB = (totalLoaded / (1024 * 1024)).toFixed(1);
            const totalMB = (fileSize / (1024 * 1024)).toFixed(1);
            setStatusText(`Uploading: ${loadedMB}MB / ${totalMB}MB (${totalPercent}%)`);
          };

          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
              let responseData = null;
              try {
                responseData = JSON.parse(xhr.responseText);
              } catch (_) {}
              resolve({ isComplete: true, responseData });
            } else if (xhr.status === 308) {
              resolve({ isComplete: false });
            } else {
              reject(new Error(`YouTube chunk upload returned HTTP ${xhr.status}: ${xhr.responseText.substring(0, 200)}`));
            }
          };

          xhr.onerror = () => {
            // If CORS hides final response, treat as completion candidate
            if (endByte + 1 >= fileSize) {
              resolve({ isComplete: true });
            } else {
              reject(new Error('Network interrupted during chunk upload.'));
            }
          };

          xhr.open('PUT', uploadUrl, true);
          xhr.setRequestHeader('Content-Range', `bytes ${startByte}-${endByte}/${fileSize}`);
          xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
          xhr.send(chunk);
        });
      };

      let start = 0;
      let isFinished = false;
      let finalData = null;

      while (start < fileSize && !isFinished) {
        const result = await uploadChunk(start);
        start = Math.min(start + CHUNK_SIZE, fileSize);

        const chunkPercent = Math.min(99, Math.round((start / fileSize) * 100));
        setProgress(chunkPercent);
        const loadedMB = (start / (1024 * 1024)).toFixed(1);
        const totalMB = (fileSize / (1024 * 1024)).toFixed(1);
        setStatusText(`Uploading: ${loadedMB}MB / ${totalMB}MB (${chunkPercent}%)`);

        if (result.isComplete) {
          isFinished = true;
          finalData = result.responseData;
        }
      }

      if (finalData && finalData.id) {
        const videoId = finalData.id;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        onSuccess(videoId, videoUrl, finalTitle);
        setStatusText('Successfully uploaded to YouTube!');
        setProgress(100);
        setUploading(false);
      } else {
        const verified = await verifyWithBackend();
        if (!verified) {
          onError('Upload finished but could not confirm video ID from YouTube. Please check in a moment.');
          setStatusText('Finalizing...');
          setUploading(false);
        }
      }

    } catch (err: any) {
      console.error(err);
      onError(err.message);
      setStatusText('Error initiating upload.');
      setUploading(false);
    }
  };

  return (
    <div className="border border-brand-border rounded-lg p-4 bg-brand-bg/50">
      <div className="flex items-center gap-2 mb-3">
        <Video className="w-5 h-5 text-sky-600" />
        <h4 className="font-semibold text-brand-text text-sm">Direct Video Upload</h4>
      </div>

      {!uploading && progress !== 100 ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Select Video File
            </label>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 border border-brand-border rounded-md cursor-pointer"
            />
          </div>

          {file && (
            <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-sky-900">
                <span className="font-medium truncate max-w-[240px]">{file.name}</span>
                <span className="text-sky-700">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Video Title on YouTube & Lesson
                </label>
                <input 
                  type="text"
                  value={videoTitle}
                  onChange={(e) => {
                    setVideoTitle(e.target.value);
                    if (onTitleAutoDetected) onTitleAutoDetected(e.target.value);
                  }}
                  placeholder="e.g. Introduction to Web Development"
                  className="w-full bg-white border border-brand-border text-brand-text text-xs rounded-lg p-2 shadow-sm focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  This title appears automatically on YouTube and will be used as the lesson title.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-brand-text/60">
            Uploads large videos directly to YouTube as unlisted videos, saving server resources.
          </p>

          <button
            type="button"
            disabled={!file}
            onClick={handleUpload}
            className="flex items-center justify-center w-full px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Start Upload
          </button>
        </div>
      ) : progress === 100 && !uploading ? (
        <div className="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
          <CheckCircle2 className="w-8 h-8 mb-2 text-green-600" />
          <p className="font-semibold text-sm">Upload Successful!</p>
          <p className="text-xs text-green-800 mt-1">
            "{videoTitle || 'Video'}" uploaded to AutoLearn YouTube channel.
          </p>
          <p className="text-[11px] text-green-600 mt-1">
            Note: YouTube is now processing video resolutions & thumbnail. Video link is saved to lesson!
          </p>
          <button 
            type="button" 
            onClick={() => { setFile(null); setProgress(0); }} 
            className="text-xs text-green-800 underline mt-2"
          >
            Upload another video
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-brand-text mb-1">
            <span>{statusText}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-sky-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <button
            type="button"
            onClick={cancelUpload}
            className="text-xs text-red-600 hover:underline flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            Cancel Upload
          </button>
        </div>
      )}
    </div>
  );
}
