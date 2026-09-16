import { getActiveConnection } from './auth';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';

export async function getChannelInfo(accessToken: string) {
  const response = await fetch(`${YOUTUBE_API_BASE}/channels?part=snippet&mine=true`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube channel info');
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('No YouTube channel found for this Google account.');
  }

  return data.items[0];
}

export async function uploadVideo(
  videoBuffer: Buffer, 
  mimeType: string, 
  title: string, 
  description: string
) {
  const connection = await getActiveConnection();
  if (!connection) {
    throw new Error('No active YouTube connection found');
  }

  const metadata = {
    snippet: {
      title,
      description,
      categoryId: '27' // Education
    },
    status: {
      privacyStatus: 'unlisted', // The intended privacy setting
      selfDeclaredMadeForKids: false
    }
  };

  const formData = new FormData();
  formData.append('snippet', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', new Blob([videoBuffer], { type: mimeType }));

  const response = await fetch(`${YOUTUBE_UPLOAD_URL}?uploadType=multipart&part=snippet,status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${connection.accessToken}`
    },
    body: formData as any
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`YouTube API upload failed: ${err}`);
  }

  const data = await response.json();
  
  return {
    videoId: data.id,
    videoUrl: `https://www.youtube.com/watch?v=${data.id}`,
    privacyStatus: data.status.privacyStatus,
    uploadStatus: data.status.uploadStatus,
  };
}

export async function getVideoStatus(videoId: string) {
  const connection = await getActiveConnection();
  if (!connection) {
    throw new Error('No active YouTube connection found');
  }

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?part=status&id=${videoId}`, {
    headers: { Authorization: `Bearer ${connection.accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch video status');
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const status = data.items[0].status;
  
  return {
    videoId,
    uploadStatus: status.uploadStatus,
    privacyStatus: status.privacyStatus,
    rejectionReason: status.rejectionReason
  };
}

export async function createResumableUploadSession(
  title: string,
  description: string,
  mimeType: string,
  fileSize: number
) {
  const connection = await getActiveConnection();
  if (!connection) {
    throw new Error('No active YouTube connection found. Please contact administration.');
  }

  const metadata = {
    snippet: {
      title,
      description,
      categoryId: '27' // Education
    },
    status: {
      privacyStatus: 'unlisted', // The intended privacy setting
      selfDeclaredMadeForKids: false
    }
  };

  const response = await fetch(`${YOUTUBE_UPLOAD_URL}?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Length': fileSize.toString(),
      'X-Upload-Content-Type': mimeType
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create resumable upload session: ${err}`);
  }

  // Google returns the resumable upload URL in the Location header
  const locationUrl = response.headers.get('location');
  if (!locationUrl) {
    throw new Error('No location header returned from YouTube API');
  }

  return { uploadUrl: locationUrl };
}
