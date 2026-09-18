import { MessageSquare, ExternalLink } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';

interface AuthorMessagingSectionProps {
  productId: string;
  userId: string;
}

export default async function AuthorMessagingSection({ productId, userId }: AuthorMessagingSectionProps) {
  // Check if there's an existing conversation with the author for this product
  const { data: product } = await supabaseAdmin
    .from('learning_products')
    .select('author_id')
    .eq('id', productId)
    .single();

  if (!product) {
    return null;
  }

  const { data: conversation } = await supabaseAdmin
    .from('author_conversations')
    .select('*')
    .eq('student_id', userId)
    .eq('author_id', product.author_id)
    .eq('learning_product_id', productId)
    .single();

  return (
    <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-5 h-5 text-sky-600" />
        <h3 className="font-semibold text-brand-text">Need Help?</h3>
      </div>
      
      <p className="text-sm text-brand-text/70 mb-4">
        Message your course instructor for support and questions.
      </p>

      <a
        href="/student/messages"
        className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        {conversation ? 'View Conversation' : 'Message Author'}
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}