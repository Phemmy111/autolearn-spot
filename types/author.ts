/**
 * Author application status values.
 */
export type AuthorStatus = 'PENDING_REVIEW' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

/**
 * Interface representing a row in uthor_applications.
 */
export interface AuthorApplication {
  id: string;
  user_id: string;
  full_name: string;
  bio?: string;
  expertise?: string[];
  experience?: string;
  portfolio_url?: string;
  social_links?: string[];
  credentials?: string;
  motivation?: string;
  terms_accepted: boolean;
  terms_accepted_at?: string; // ISO timestamp
  status: AuthorStatus;
  admin_review_note?: string;
  created_at: string;
  updated_at: string;
}
