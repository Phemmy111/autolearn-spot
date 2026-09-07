// Learning Product Details Page
import { notFound } from 'next/navigation';
import { getPublishedProducts } from '@/lib/public-product-service';
import { supabaseAdmin } from '@/lib/supabase';
import AddToCartButton from '@/components/marketplace/AddToCartButton';

interface PageParams {
  params: { id: string };
}

export default async function LearningProductPage({ params }: PageParams) {
  const { id } = params;
  // Fetch product server-side


  const { data: product, error } = await supabaseAdmin
    .from('learning_products')
    .select('*')
    .eq('id', id)
    .eq('status', 'PUBLISHED')
    .single();

  if (error || !product) {
    notFound();
    return null;
  }

  // Render component
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
      {product.thumbnail_url && (
        <Image
          src={product.thumbnail_url}
          alt={product.title}
          width={600}
          height={400}
          className="object-cover rounded mb-4"
        />
      )}
      <p className="mb-2">{product.description}</p>
      <p className="font-semibold mb-2">Price: {product.currency} {product.price}</p>
      {/* Curriculum preview placeholder */}
      {product.curriculum && (
        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-2">Curriculum Preview</h2>
          {/* Assuming a JSON field or related table – could be rendered here */}
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(product.curriculum, null, 2)}</pre>
        </div>
      )}
      <AddToCartButton productId={product.id} />
    </div>
  );
}
