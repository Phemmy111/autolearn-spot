"use client";

import { useState, useEffect } from 'react';
import { Video, Plus, Calendar, Clock, ExternalLink, Trash2, Edit } from 'lucide-react';

interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  meeting_url: string;
  learning_products: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
}

interface Product {
  id: string;
  title: string;
}

export default function AuthorLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);

  useEffect(() => {
    fetchLiveClasses();
    fetchProducts();
  }, []);

  const fetchLiveClasses = async () => {
    try {
      const response = await fetch('/api/author/live-classes');
      const data = await response.json();
      if (data.success) {
        setLiveClasses(data.liveClasses);
      }
    } catch (error) {
      console.error('Error fetching live classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/author/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      const response = await fetch('/api/author/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateForm(false);
        fetchLiveClasses();
      } else {
        alert(data.error || 'Failed to create live class');
      }
    } catch (error) {
      console.error('Error creating live class:', error);
      alert('Failed to create live class');
    }
  };

  const handleUpdate = async (id: string, formData: any) => {
    try {
      const response = await fetch(`/api/author/live-classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setEditingClass(null);
        fetchLiveClasses();
      } else {
        alert(data.error || 'Failed to update live class');
      }
    } catch (error) {
      console.error('Error updating live class:', error);
      alert('Failed to update live class');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this live class?')) return;

    try {
      const response = await fetch(`/api/author/live-classes/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchLiveClasses();
      } else {
        alert(data.error || 'Failed to cancel live class');
      }
    } catch (error) {
      console.error('Error cancelling live class:', error);
      alert('Failed to cancel live class');
    }
  };

  const upcomingClasses = liveClasses.filter(c => c.status === 'SCHEDULED' && new Date(c.scheduled_start) > new Date());
  const pastClasses = liveClasses.filter(c => c.status === 'ENDED' || new Date(c.scheduled_start) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">
            Live Classes
          </h1>
          <p className="text-brand-text/70">
            Schedule and manage your live class sessions
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Class
        </button>
      </div>

      {showCreateForm && (
        <LiveClassForm
          products={products}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingClass && (
        <LiveClassForm
          liveClass={editingClass}
          products={products}
          onSubmit={(data) => handleUpdate(editingClass.id, data)}
          onCancel={() => setEditingClass(null)}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-brand-text/50">Loading live classes...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Classes */}
          <div>
            <h2 className="text-lg font-semibold text-brand-text mb-4">
              Upcoming Classes
            </h2>
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-8 text-brand-text/50">
                No upcoming classes scheduled
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((liveClass) => (
                  <LiveClassCard
                    key={liveClass.id}
                    liveClass={liveClass}
                    onEdit={() => setEditingClass(liveClass)}
                    onCancel={() => handleCancel(liveClass.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past Classes */}
          <div>
            <h2 className="text-lg font-semibold text-brand-text mb-4">
              Past Classes
            </h2>
            {pastClasses.length === 0 ? (
              <div className="text-center py-8 text-brand-text/50">
                No past classes
              </div>
            ) : (
              <div className="space-y-3">
                {pastClasses.map((liveClass) => (
                  <LiveClassCard
                    key={liveClass.id}
                    liveClass={liveClass}
                    onEdit={() => setEditingClass(liveClass)}
                    onCancel={() => handleCancel(liveClass.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveClassCard({ liveClass, onEdit, onCancel }: { liveClass: LiveClass; onEdit: () => void; onCancel: () => void }) {
  const isUpcoming = liveClass.status === 'SCHEDULED' && new Date(liveClass.scheduled_start) > new Date();
  const startDate = new Date(liveClass.scheduled_start);
  const endDate = new Date(liveClass.scheduled_end);

  return (
    <div className="p-4 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-brand-text">{liveClass.title}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              liveClass.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' :
              liveClass.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {liveClass.status}
            </span>
          </div>
          <p className="text-sm text-brand-text/70 mb-2">
            {liveClass.learning_products.title}
          </p>
          <div className="flex items-center gap-4 text-xs text-brand-text/50">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {startDate.toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
              {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isUpcoming && (
            <>
              <a
                href={liveClass.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 transition-colors"
              >
                <Video className="w-3 h-3" />
                Join
              </a>
              <button
                onClick={onEdit}
                className="p-1.5 text-brand-text/70 hover:text-sky-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={onCancel}
                className="p-1.5 text-brand-text/70 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveClassForm({ liveClass, products, onSubmit, onCancel }: { liveClass?: LiveClass; products: Product[]; onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    learning_product_id: liveClass?.learning_products.id || '',
    title: liveClass?.title || '',
    description: liveClass?.description || '',
    scheduled_start: liveClass?.scheduled_start ? new Date(liveClass.scheduled_start).toISOString().slice(0, 16) : '',
    scheduled_end: liveClass?.scheduled_end ? new Date(liveClass.scheduled_end).toISOString().slice(0, 16) : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
      <h2 className="text-lg font-semibold text-brand-text mb-4">
        {liveClass ? 'Edit Live Class' : 'Schedule New Live Class'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">
            Product
          </label>
          <select
            value={formData.learning_product_id}
            onChange={(e) => setFormData({ ...formData, learning_product_id: e.target.value })}
            className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
            disabled={!!liveClass}
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">
            Class Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_start}
              onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_end}
              onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            {liveClass ? 'Update' : 'Schedule'} Class
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}