"use client";

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function YouTubeUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // Validate size (max 50MB for test)
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Please use a file smaller than 50MB for this test.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', `Test Upload: ${file.name}`);
    formData.append('description', 'Test video uploaded via AutoLearn Spot admin infrastructure');

    try {
      const res = await fetch('/api/admin/integrations/youtube/test-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const checkStatus = async () => {
    if (!result?.videoId) return;
    
    setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/admin/integrations/youtube/status?videoId=${result.videoId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Status check failed');
      }
      
      setResult({ ...result, ...data });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-gray-800">Test Video Upload</h3>
      
      <form onSubmit={handleUpload} className="mb-6 space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Video</label>
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-md"
          />
        </div>
        
        <button
          type="submit"
          disabled={!file || isUploading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {isUploading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
          {isUploading ? 'Uploading...' : 'Upload Test Video'}
        </button>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
              <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <h4 className="font-bold text-gray-800">Upload Successful</h4>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-gray-500">Video ID</p>
              <p className="font-medium text-gray-900">{result.videoId}</p>
            </div>
            <div>
              <p className="text-gray-500">URL</p>
              <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                Open in YouTube
              </a>
            </div>
            <div>
              <p className="text-gray-500">Intended Privacy</p>
              <p className="font-medium text-gray-900 capitalize">Unlisted</p>
            </div>
            <div>
              <p className="text-gray-500">Actual Privacy Status</p>
              <p className={`font-medium capitalize ${result.privacyStatus === 'private' ? 'text-yellow-600' : 'text-gray-900'}`}>
                {result.privacyStatus}
              </p>
              {result.privacyStatus === 'private' && (
                <p className="text-xs text-yellow-600 mt-1 max-w-[200px]">
                  (YouTube may require API project verification before Unlisted uploads are allowed)
                </p>
              )}
            </div>
            <div>
              <p className="text-gray-500">Upload Status</p>
              <p className="font-medium text-gray-900 capitalize">{result.uploadStatus}</p>
            </div>
            {result.processingStatus && (
              <div>
                <p className="text-gray-500">Processing Status</p>
                <p className="font-medium text-gray-900 capitalize">{result.processingStatus}</p>
              </div>
            )}
            {result.rejectionReason && (
              <div className="col-span-2">
                <p className="text-gray-500">Rejection Reason</p>
                <p className="font-medium text-red-600">{result.rejectionReason}</p>
              </div>
            )}
          </div>

          <button
            onClick={checkStatus}
            disabled={isCheckingStatus}
            className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-medium rounded-lg transition-colors"
          >
            {isCheckingStatus && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
            {isCheckingStatus ? 'Checking...' : 'Check Processing Status'}
          </button>
        </div>
      )}
    </div>
  );
}
