export interface YouTubeConnection {
  id: string;
  provider: string;
  channel_id: string;
  channel_name: string;
  encrypted_refresh_token: string;
  scopes: string;
  status: 'active' | 'revoked' | 'error';
  connected_by: string;
  created_at: string;
  updated_at: string;
}

export interface YouTubeUploadResponse {
  videoId: string;
  videoUrl: string;
  privacyStatus: string;
  uploadStatus: string;
}

export interface YouTubeVideoStatus {
  videoId: string;
  uploadStatus: string;
  privacyStatus: string;
  processingStatus?: string;
  rejectionReason?: string;
}
