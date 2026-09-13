"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Upload, Trash2, Image as ImageIcon, Video, Copy, X, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminMediaPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/admin/content/media');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else {
        setError('Failed to fetch files');
      }
    } catch (e) {
      setError('Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/content/media', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        fetchFiles();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to upload file');
      }
    } catch (e) {
      setError('Failed to upload file');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`/api/admin/content/media?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchFiles();
      } else {
        setError('Failed to delete file');
      }
    } catch (e) {
      setError('Failed to delete file');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#10b981] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-gray-100/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/content" className="text-neutral-600 hover:text-neutral-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Media Library</h1>
                <p className="text-sm text-neutral-600">Manage uploaded media files</p>
              </div>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-[#00363a] rounded-lg font-medium hover:bg-gray-50/90 transition-colors cursor-pointer">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload File
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,video/mp4,video/webm"
                onChange={handleUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-6">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-sm text-green-400">File uploaded successfully</p>
          </div>
        )}

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.map((file) => (
            <div key={file.id} className="border border-neutral-200 bg-gray-100/50 backdrop-blur-xl rounded-xl overflow-hidden">
              {/* Preview */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                {file.type.startsWith('image/') ? (
                  <img
                    src={file.publicUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : file.type.startsWith('video/') ? (
                  <Video className="h-12 w-12 text-neutral-500" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-neutral-500" />
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-sm font-medium text-neutral-900 truncate mb-2" title={file.name}>
                  {file.name}
                </p>
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-neutral-500">{formatFileSize(file.size)}</p>
                  <p className="text-xs text-neutral-500">{formatDate(file.created_at)}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(file.publicUrl)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 border border-neutral-200 rounded text-xs text-neutral-600 hover:text-neutral-900 hover:border-[#10b981] transition-colors"
                  >
                    {copiedUrl === file.publicUrl ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy URL
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(file.name)}
                    className="p-1.5 bg-gray-100 border border-neutral-200 rounded text-neutral-600 hover:text-red-400 hover:border-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {files.length === 0 && (
          <div className="text-center py-12 text-neutral-600">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-neutral-500" />
            <p>No media files yet</p>
            <p className="text-sm mt-2">Click "Upload File" to add your first media file</p>
          </div>
        )}
      </div>
    </div>
  );
}
