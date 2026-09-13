'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Package, CheckCircle, XCircle, AlertTriangle, 
  BookOpen, Video, FileText, CheckSquare, Clock
} from 'lucide-react';

export default function AdminProductReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProduct(data.product);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!confirm(`Are you sure you want to change status to ${status}?`)) return;
    
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(`Product ${status.toLowerCase()} successfully`);
      setProduct(data.product);
    } catch (err: any) {
      alert(err.message || 'Error updating product');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div></div>;
  if (error || !product) return <div className="p-12 text-center text-red-500">{error || 'Product not found'}</div>;

  const desc = product.description ? (typeof product.description === 'string' && product.description.startsWith('{') ? JSON.parse(product.description) : { full_description: product.description }) : {};

  return (
    <div className="min-h-screen bg-[var(--card)] pb-20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Back Link */}
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-brand-text/60 hover:text-brand-text mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
          <div className="flex gap-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-brand-border">
              {product.thumbnail_url ? (
                <img src={product.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-neutral-300" /></div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  product.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 border-green-200' :
                  product.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  product.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  {product.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-brand-text/50 font-medium">
                  Submitted: {new Date(product.updated_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-brand-text mb-2">{product.title}</h1>
              <div className="text-sm text-brand-text/70 space-y-1">
                <p><strong>Author:</strong> {product.author?.name} ({product.author?.email})</p>
                <p><strong>Skill:</strong> {product.skill?.name || 'Unknown'}</p>
                <p><strong>Price:</strong> {product.price > 0 ? `${product.currency} ${product.price.toLocaleString()}` : 'Free'}</p>
                <p><strong>Type:</strong> {product.product_type} • <strong>Access:</strong> {product.access_duration_days} days</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            {product.status === 'PENDING_REVIEW' && (
              <>
                <button 
                  onClick={() => handleStatusChange('PUBLISHED')}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Publish
                </button>
                <button 
                  onClick={() => handleStatusChange('REJECTED')}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            {product.status === 'PUBLISHED' && (
              <button 
                onClick={() => handleStatusChange('SUSPENDED')}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-orange-200 transition-colors disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" /> Suspend Product
              </button>
            )}
            {(product.status === 'REJECTED' || product.status === 'SUSPENDED') && (
              <button 
                onClick={() => handleStatusChange('PENDING_REVIEW')}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Reset to Pending
              </button>
            )}
          </div>
        </div>

        {/* Feedback Textarea (Always shown if admin wants to add a note) */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-brand-text mb-2">Admin Feedback / Reason (Optional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide feedback for rejection or changes required..."
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent min-h-[100px] text-brand-text"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-brand-bg border border-brand-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4 border-b border-brand-border pb-2">Description</h2>
              <div className="prose prose-sm max-w-none text-brand-text/80 whitespace-pre-wrap">
                {desc.full_description || product.description}
              </div>
            </div>

            {/* Curriculum/Lessons Summary */}
            <div className="bg-brand-bg border border-brand-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4 border-b border-brand-border pb-2">Curriculum ({product.lessons?.length || 0} Lessons)</h2>
              {product.lessons && product.lessons.length > 0 ? (
                <ul className="space-y-3">
                  {product.lessons.sort((a: any, b: any) => a.order_index - b.order_index).map((lesson: any, i: number) => (
                    <li key={lesson.id} className="flex items-center justify-between p-3 border border-brand-border rounded-lg bg-[var(--card)] brightness-95">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex flex-shrink-0 items-center justify-center bg-sky-100 text-sky-700 rounded-full text-xs font-bold">{i + 1}</span>
                        <span className="font-medium text-sm text-brand-text">{lesson.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${lesson.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {lesson.status === 'PUBLISHED' ? 'Published' : (lesson.status || 'Draft')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-red-500 italic">No lessons have been added to this product.</p>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {/* Structured Metadata */}
            <div className="bg-brand-bg border border-brand-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4 border-b border-brand-border pb-2">Details</h2>
              <ul className="space-y-4">
                <li>
                  <p className="text-xs text-brand-text/60 font-medium uppercase tracking-wider mb-1">Difficulty</p>
                  <p className="text-sm font-medium text-brand-text">{desc.difficulty || 'All Levels'}</p>
                </li>
                <li>
                  <p className="text-xs text-brand-text/60 font-medium uppercase tracking-wider mb-1">Target Audience</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {desc.target_audience && desc.target_audience.length > 0 ? desc.target_audience.map((ta: string) => (
                      <span key={ta} className="text-xs bg-[var(--card)] brightness-95 border border-brand-border px-2 py-1 rounded-md text-brand-text/80">{ta}</span>
                    )) : <span className="text-sm text-brand-text/60">—</span>}
                  </div>
                </li>
              </ul>
            </div>

            {/* Validation Checklist */}
            <div className="bg-brand-bg border border-brand-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-brand-text mb-4 border-b border-brand-border pb-2">Completeness Check</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  {product.title ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                  <span className={product.title ? 'text-brand-text' : 'text-red-600 font-medium'}>Title and metadata</span>
                </li>
                <li className="flex items-start gap-2">
                  {product.thumbnail_url ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                  <span className={product.thumbnail_url ? 'text-brand-text' : 'text-brand-text/70'}>Thumbnail image</span>
                </li>
                <li className="flex items-start gap-2">
                  {product.price !== null ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                  <span className={product.price !== null ? 'text-brand-text' : 'text-red-600 font-medium'}>Pricing configured</span>
                </li>
                <li className="flex items-start gap-2">
                  {product.lessons && product.lessons.length > 0 ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                  <span className={product.lessons && product.lessons.length > 0 ? 'text-brand-text' : 'text-red-600 font-medium'}>At least 1 lesson</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
