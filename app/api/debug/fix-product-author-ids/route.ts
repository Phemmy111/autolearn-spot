import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Get all products with their current author_id
    const { data: products, error: productsError } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, author_id');

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    // Get all authors with their clerk_user_id
    const { data: authors, error: authorsError } = await supabaseAdmin
      .from('authors')
      .select('id, clerk_user_id, display_name');

    if (authorsError) {
      return NextResponse.json({ error: authorsError.message }, { status: 500 });
    }

    // Create a mapping from clerk_user_id to author.id
    const clerkToAuthorMap = new Map();
    authors.forEach(author => {
      clerkToAuthorMap.set(author.clerk_user_id, author.id);
    });

    let fixedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Fix each product
    for (const product of products || []) {
      if (!product.author_id) {
        skippedCount++;
        continue;
      }

      // Check if author_id is a clerk_user_id (starts with "user_")
      if (product.author_id.startsWith('user_')) {
        const correctAuthorId = clerkToAuthorMap.get(product.author_id);
        
        if (correctAuthorId) {
          // Update the product with the correct author.id
          const { error: updateError } = await supabaseAdmin
            .from('learning_products')
            .update({ author_id: correctAuthorId })
            .eq('id', product.id);

          if (updateError) {
            errors.push(`Product ${product.title}: ${updateError.message}`);
          } else {
            fixedCount++;
          }
        } else {
          errors.push(`Product ${product.title}: No author found for clerk_user_id ${product.author_id}`);
        }
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      fixed: fixedCount,
      skipped: skippedCount,
      errors: errors.slice(0, 10),
      message: `Fixed ${fixedCount} products, skipped ${skippedCount}`
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
