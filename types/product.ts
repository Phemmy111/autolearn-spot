export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'UNPUBLISHED';

export interface LearningProduct {
  id: string;
  author_id: string; // never from client
  skill_id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url?: string | null;
  product_type: string;
  price: number;
  currency: string;
  access_duration_days?: number | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}
