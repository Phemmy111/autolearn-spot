import { supabaseAdmin } from '@/lib/supabase';
import { LearningProduct } from '@/types/product';

/** Fetch all published learning products for the marketplace frontend */
export async function getPublishedProducts(): Promise<LearningProduct[]> {
  const { data, error } = await supabaseAdmin
    .from('learning_products')
    .select('*')
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[public-product-service] getPublishedProducts error:', error);
    return [];
  }

  return (data as LearningProduct[]) || [];
}

export async function getPublishedProductsBySkill(skillSlug: string): Promise<LearningProduct[]> {
  // First find the skill
  const { data: skill } = await supabaseAdmin
    .from('skills')
    .select('id')
    .eq('slug', skillSlug)
    .single();

  if (!skill) return [];

  const { data, error } = await supabaseAdmin
    .from('learning_products')
    .select('*')
    .eq('status', 'PUBLISHED')
    .eq('skill_id', skill.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[public-product-service] getPublishedProductsBySkill error:', error);
    return [];
  }

  return (data as LearningProduct[]) || [];
}
