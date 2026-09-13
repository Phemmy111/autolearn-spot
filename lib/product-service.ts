import { supabaseAdmin } from '@/lib/supabase';
import { LearningProduct, ProductStatus } from '@/types/product';
import { requireAuthor } from '@/lib/author';

/** Helper to get authenticated author id */
async function getAuthorId(): Promise<string> {
  const result = await requireAuthor();
  if ("userId" in result) {
    return result.userId;
  }
  // If requireAuthor returned a NextResponse, throw it to be handled by the route
  throw result;
}

/** Validate product completeness before submission */
export function validateProductCompleteness(product: Partial<LearningProduct>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!product.title || product.title.trim() === '') {
    errors.push('Product title is required');
  }

  if (!product.description || product.description.trim() === '') {
    errors.push('Product description is required');
  }

  if (!product.skill_id) {
    errors.push('Skill selection is required');
  }

  if (!product.product_type) {
    errors.push('Product type is required');
  }

  if (product.price === undefined || product.price === null) {
    errors.push('Price is required');
  }

  if (!product.currency) {
    errors.push('Currency is required');
  }

  if (!product.access_duration_days) {
    errors.push('Access duration is required');
  }

  // Check if product has at least one lesson (if lessons table is populated)
  // This will be validated in the submit endpoint after we add lesson support

  return {
    valid: errors.length === 0,
    errors
  };
}

/** Create a new product as DRAFT */
export async function createProduct(data: Omit<LearningProduct, 'id' | 'author_id' | 'status' | 'created_at' | 'updated_at'>): Promise<LearningProduct | null> {
  const authorId = await getAuthorId();
  const payload = {
    ...data,
    author_id: authorId,
    status: 'DRAFT' as ProductStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabaseAdmin.from('learning_products').insert(payload).select().single();
  if (error) {
    console.error('[product-service] create error:', error);
    return null;
  }
  return result as LearningProduct;
}

/** Update mutable fields of owned product (only DRAFT or UNPUBLISHED) */
export async function updateProduct(productId: string, updates: Partial<Omit<LearningProduct, 'id' | 'author_id' | 'created_at' | 'updated_at'>>): Promise<LearningProduct | null> {
  const authorId = await getAuthorId();
  const { data: existing, error: selError } = await supabaseAdmin.from('learning_products').select('status').eq('id', productId).eq('author_id', authorId).single();
  if (selError || !existing) {
    console.error('[product-service] ownership check failed:', selError);
    return null;
  }
  const allowed = ['DRAFT', 'UNPUBLISHED'];
  if (!allowed.includes((existing as any).status)) {
    console.error('[product-service] cannot edit status', (existing as any).status);
    return null;
  }
  const payload = { ...updates, updated_at: new Date().toISOString() };
  const { data: result, error } = await supabaseAdmin.from('learning_products').update(payload).eq('id', productId).eq('author_id', authorId).select().single();
  if (error) {
    console.error('[product-service] update error:', error);
    return null;
  }
  return result as LearningProduct;
}

/** Submit DRAFT for review */
export async function submitProduct(productId: string): Promise<LearningProduct | null> {
  const authorId = await getAuthorId();
  const { data: existing, error: selError } = await supabaseAdmin.from('learning_products').select('status').eq('id', productId).eq('author_id', authorId).single();
  if (selError || !existing) {
    console.error('[product-service] submit ownership failed:', selError);
    return null;
  }
  if ((existing as any).status !== 'DRAFT') {
    console.error('[product-service] only DRAFT can be submitted');
    return null;
  }
  const { data: result, error } = await supabaseAdmin.from('learning_products').update({ status: 'PENDING_REVIEW' as ProductStatus, updated_at: new Date().toISOString() }).eq('id', productId).eq('author_id', authorId).select().single();
  if (error) {
    console.error('[product-service] submit error:', error);
    return null;
  }
  return result as LearningProduct;
}

/** Delete a DRAFT product */
export async function deleteProduct(productId: string): Promise<boolean> {
  const authorId = await getAuthorId();
  const { data: existing, error: selError } = await supabaseAdmin.from('learning_products').select('status').eq('id', productId).eq('author_id', authorId).single();
  if (selError || !existing) {
    console.error('[product-service] delete ownership failed:', selError);
    return false;
  }
  if ((existing as any).status !== 'DRAFT') {
    console.error('[product-service] only DRAFT can be deleted');
    return false;
  }
  const { error } = await supabaseAdmin.from('learning_products').delete().eq('id', productId).eq('author_id', authorId);
  if (error) {
    console.error('[product-service] delete error:', error);
    return false;
  }
  return true;
}

/** List author's products, optional status filter */
export async function listOwnProducts(filter?: { status?: ProductStatus }): Promise<LearningProduct[]> {
  const authorId = await getAuthorId();
  let query = supabaseAdmin.from('learning_products').select('*').eq('author_id', authorId);
  if (filter?.status) {
    query = query.eq('status', filter.status);
  }
  const { data, error } = await query;
  if (error) {
    console.error('[product-service] list error:', error);
    return [];
  }
  return (data as LearningProduct[]) || [];
}
