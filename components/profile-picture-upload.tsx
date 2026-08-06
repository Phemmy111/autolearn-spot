'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, Loader2, CheckCircle2 } from 'lucide-react'

interface ProfilePictureUploadProps {
  currentPicture?: string | null
  onUploadComplete?: (pictureUrl: string) => void
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ProfilePictureUpload({ 
  currentPicture, 
  onUploadComplete, 
  size = 'md',
  showLabel = true 
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPicture || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[Profile Picture Upload] Starting upload for file:', file.name, file.size)

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('[Profile Picture Upload] Sending to API')

      const response = await fetch('/api/user/profile-picture', {
        method: 'POST',
        body: formData
      })

      console.log('[Profile Picture Upload] Response status:', response.status)

      const result = await response.json()
      console.log('[Profile Picture Upload] Response data:', result)

      if (response.ok && result.success) {
        console.log('[Profile Picture Upload] Upload successful')
        setUploaded(true)
        setPreview(result.profilePicture)
        onUploadComplete?.(result.profilePicture)
        setTimeout(() => setUploaded(false), 2000)
      } else {
        console.error('[Profile Picture Upload] Upload failed:', result.error)
        alert(result.error || 'Failed to upload profile picture')
        setPreview(currentPicture || null)
      }
    } catch (error) {
      console.error('[Profile Picture Upload] Upload error:', error)
      alert('Failed to upload profile picture')
      setPreview(currentPicture || null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-[#1f2229] bg-[#111317] flex items-center justify-center group`}>
        {preview ? (
          <img 
            src={preview} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1f2229]">
            <Camera className="h-8 w-8 text-[#b9cacb]" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#00f0ff] text-black px-3 py-2 rounded-lg font-bold hover:bg-white transition-colors flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : uploaded ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : uploaded ? 'Uploaded!' : 'Change'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {showLabel && (
        <div className="text-center">
          <p className="text-sm text-[#b9cacb]">Profile Picture</p>
          <p className="text-xs text-[#b9cacb]/60">JPG, PNG (max 5MB)</p>
        </div>
      )}
    </div>
  )
}
