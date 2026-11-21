"use client";
import React, { useState, useRef } from 'react';
import { Video, UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface YouTubeResumableUploaderProps {
  onSuccess: (videoId: string, videoUrl: string) => void;
  onError: (error: string) => void;
}

export function YouTubeResumableUploader({ onSuccess, onError }: YouTubeResumableUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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

    setUploading(true);
    setProgress(0);
    setStatusText('Requesting secure upload session...');

    try {
      // 1. Get the resumable upload URL from our server
      const sessionRes = await fetch('/api/author/integrations/youtube/upload-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name,
          description: 'Uploaded via AutoLearn Author Studio',
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
      // Chunked streaming guarantees the progress bar actively advances across all browsers and networks.
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
              body: JSON.stringify({ uploadUrl, fileSize: file.size, title: file.name })
            });
            const checkData = await checkRes.json();
            if (checkData.success && checkData.videoId) {
              const videoUrl = checkData.videoUrl || `https://www.youtube.com/watch?v=${checkData.videoId}`;
              onSuccess(checkData.videoId, videoUrl);
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
            const percent = Math.min(99, Math.round((totalLoaded / fileSize) * 100));
            setProgress(percent);
            const loadedMB = (totalLoaded / (1024 * 1024)).toFixed(1);
            const totalMB = (fileSize / (1024 * 1024)).toFixed(1);
            setStatusText(`Uploading: ${loadedMB}MB / ${totalMB}MB (${percent}%)`);
          };

          xhr.onload = () => {
            if (xhr.status === 308) {
              // 308 Resume Incomplete: Google successfully saved this chunk, proceed to next
              resolve({ isComplete: false });
            } else if (xhr.status >= 200 && xhr.status < 300) {
              // 200/201: Upload finished
              try {
                const data = JSON.parse(xhr.responseText);
                resolve({ isComplete: true, responseData: data });
              } catch (e) {
                resolve({ isComplete: true });
              }
            } else {
              reject(new Error(`YouTube upload returned status ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            // On final chunk, browser CORS restriction might trigger onerror even though bytes succeeded
            if (endByte >= fileSize - 1) {
              resolve({ isComplete: true });
            } else {
              reject(new Error('Network error during video chunk upload'));
            }
          };

          xhr.onabort = () => {
            reject(new Error('Upload cancelled'));
          };

          xhr.open('PUT', uploadUrl, true);
          xhr.setRequestHeader('Content-Range', `bytes ${startByte}-${endByte}/${fileSize}`);
          xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
          xhr.send(chunk);
        });
      };

      let start = 0;
      let isFinished = false;
      let finalData: any = null;

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
        onSuccess(videoId, videoUrl);
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
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 border border-brand-border rounded-md cursor-pointer"
          />
          <p className="text-xs text-brand-text/60">
            Uploads large videos directly to YouTube, bypassing server limits.
          </p>
          <button
            type="button"
            disabled={!file}
            onClick={handleUpload}
            className="flex items-center justify-center w-full px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Start Upload
          </button>
        </div>
      ) : progress === 100 && !uploading ? (
        <div className="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle2 className="w-8 h-8 mb-2" />
          <p className="font-medium text-sm">Upload Successful!</p>
          <button type="button" onClick={() => {setFile(null); setProgress(0);}} className="text-xs text-green-800 underline mt-2">
            Upload another
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-brand-text mb-1">
            <span>{statusText}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-sky-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
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
