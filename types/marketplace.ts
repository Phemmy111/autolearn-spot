export type ProductType = 'COURSE' | 'MASTERCLASS'
export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'UNPUBLISHED'
export type CategoryStatus = 'active' | 'inactive' | 'archived'
export type SkillStatus = 'active' | 'inactive' | 'archived'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  status: CategoryStatus
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  status: SkillStatus
  created_at: string
  updated_at: string
}

export interface LearningProduct {
  id: string
  skill_id: string | null
  author_id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  product_type: ProductType
  price: number
  currency: string
  access_duration_days: number | null
  status: ProductStatus
  published_at: string | null
  created_at: string
  updated_at: string
}
