"use client";
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, Plus, Trash2, Edit, Eye, Video, Clock, GripVertical, FileText, HelpCircle } from 'lucide-react';

interface Lesson {
  uuid_id: string;
  id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  youtube_thumbnail: string | null;
  duration_label: string | null;
  order_index: number;
  status: string;
  is_required: boolean;
  unlock_config: any;
  created_at: string;
  updated_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number | null;
  passing_score: number;
  is_active: boolean;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  submission_type: string;
  is_required: boolean;
  due_date: string | null;
  max_score: number;
}

export default function CurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: productId } = use(params);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // New lesson form state
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDescription, setNewLessonDescription] = useState('');
  const [newLessonYoutubeUrl, setNewLessonYoutubeUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');

  // Edit lesson form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editIsRequired, setEditIsRequired] = useState(true);

  // Quiz state
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [quizLessonId, setQuizLessonId] = useState<string | null>(null);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [newQuizTimeLimit, setNewQuizTimeLimit] = useState('');
  const [newQuizPassingScore, setNewQuizPassingScore] = useState('70');

  // Assignment state
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [assignmentLessonId, setAssignmentLessonId] = useState<string | null>(null);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDescription, setNewAssignmentDescription] = useState('');
  const [newAssignmentInstructions, setNewAssignmentInstructions] = useState('');
  const [newAssignmentType, setNewAssignmentType] = useState('url');
  const [newAssignmentRequired, setNewAssignmentRequired] = useState(true);
  const [newAssignmentMaxScore, setNewAssignmentMaxScore] = useState('100');

  useEffect(() => {
    fetchLessons();
  }, [productId]);

  const fetchLessons = async () => {
    try {
      const res = await fetch(`/api/author/products/${productId}/lessons`);
      const data = await res.json();
      
      if (data.success) {
        setLessons(data.lessons);
      } else {
        setError(data.error || 'Failed to load lessons');
      }
    } catch (err) {
      setError('Network error loading lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/author/products/${productId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newLessonTitle,
          description: newLessonDescription,
          youtube_url: newLessonYoutubeUrl,
          duration_label: newLessonDuration
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewLessonTitle('');
        setNewLessonDescription('');
        setNewLessonYoutubeUrl('');
        setNewLessonDuration('');
        setShowAddLesson(false);
        fetchLessons();
      } else {
        setError(data.error || 'Failed to create lesson');
      }
    } catch (err) {
      setError('Network error creating lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonUuidId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const res = await fetch(`/api/author/products/${productId}/lessons/${lessonUuidId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        fetchLessons();
      } else {
        setError(data.error || 'Failed to delete lesson');
      }
    } catch (err) {
      setError('Network error deleting lesson');
    }
  };

  const handleMoveLesson = async (lessonUuidId: string, direction: 'up' | 'down') => {
    const currentIndex = lessons.findIndex(l => l.uuid_id === lessonUuidId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;

    const reorderedLessons = [...lessons];
    [reorderedLessons[currentIndex], reorderedLessons[newIndex]] = 
    [reorderedLessons[newIndex], reorderedLessons[currentIndex]];

    const lessonIds = reorderedLessons.map(l => l.uuid_id);

    try {
      const res = await fetch(`/api/author/products/${productId}/lessons/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonIds })
      });

      const data = await res.json();
      if (data.success) {
        setLessons(reorderedLessons);
      } else {
        setError(data.error || 'Failed to reorder lessons');
      }
    } catch (err) {
      setError('Network error reordering lessons');
    }
  };

  const handleToggleStatus = async (lessonUuidId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    
    try {
      const res = await fetch(`/api/author/products/${productId}/lessons/${lessonUuidId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (data.success) {
        fetchLessons();
      } else {
        setError(data.error || 'Failed to update lesson status');
      }
    } catch (err) {
      setError('Network error updating lesson status');
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title);
    setEditDescription(lesson.description || '');
    setEditYoutubeUrl(lesson.youtube_url || '');
    setEditDuration(lesson.duration_label || '');
    setEditIsRequired(lesson.is_required);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/author/products/${productId}/lessons/${editingLesson.uuid_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          youtube_url: editYoutubeUrl,
          duration_label: editDuration,
          is_required: editIsRequired
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditingLesson(null);
        fetchLessons();
      } else {
        setError(data.error || 'Failed to update lesson');
      }
    } catch (err) {
      setError('Network error updating lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLesson(null);
    setEditTitle('');
    setEditDescription('');
    setEditYoutubeUrl('');
    setEditDuration('');
    setEditIsRequired(true);
  };

  const handleAddQuiz = async (lessonUuidId: string) => {
    if (!newQuizTitle.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/author/products/${productId}/lessons/${lessonUuidId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newQuizTitle,
          description: newQuizDescription,
          time_limit: newQuizTimeLimit ? parseInt(newQuizTimeLimit) : null,
          passing_score: parseInt(newQuizPassingScore)
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewQuizTitle('');
        setNewQuizDescription('');
        setNewQuizTimeLimit('');
        setNewQuizPassingScore('70');
        setShowAddQuiz(false);
        setQuizLessonId(null);
        // Refresh lesson data to show quiz count
        fetchLessons();
      } else {
        setError(data.error || 'Failed to create quiz');
      }
    } catch (err) {
      setError('Network error creating quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAssignment = async (lessonUuidId: string) => {
    if (!newAssignmentTitle.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/author/products/${productId}/lessons/${lessonUuidId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAssignmentTitle,
          description: newAssignmentDescription,
          instructions: newAssignmentInstructions,
          submission_type: newAssignmentType,
          is_required: newAssignmentRequired,
          max_score: parseInt(newAssignmentMaxScore)
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewAssignmentTitle('');
        setNewAssignmentDescription('');
        setNewAssignmentInstructions('');
        setNewAssignmentType('url');
        setNewAssignmentRequired(true);
        setNewAssignmentMaxScore('100');
        setShowAddAssignment(false);
        setAssignmentLessonId(null);
        // Refresh lesson data to show assignment count
        fetchLessons();
      } else {
        setError(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      setError('Network error creating assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="text-center text-neutral-500 py-12">Loading curriculum...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Curriculum</h1>
            <p className="text-neutral-500 mt-2">Manage your product's lessons and learning content</p>
          </div>
          <button
            onClick={() => router.push(`/author/products/${productId}/edit`)}
            className="px-4 py-2 text-neutral-600 font-semibold text-sm hover:text-neutral-900 transition-colors"
          >
            Back to Product Details
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="text-3xl font-bold text-neutral-900">{lessons.length}</div>
          <div className="text-sm text-neutral-500 mt-1">Total Lessons</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="text-3xl font-bold text-emerald-600">
            {lessons.filter(l => l.status === 'PUBLISHED').length}
          </div>
          <div className="text-sm text-neutral-500 mt-1">Published</div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="text-3xl font-bold text-amber-600">
            {lessons.filter(l => l.status === 'DRAFT').length}
          </div>
          <div className="text-sm text-neutral-500 mt-1">Drafts</div>
        </div>
      </div>

      {/* Add Lesson Button */}
      {!showAddLesson && (
        <button
          onClick={() => setShowAddLesson(true)}
          className="w-full mb-6 p-4 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-500 hover:border-sky-500 hover:text-sky-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Lesson
        </button>
      )}

      {/* Add Lesson Form */}
      {showAddLesson && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Add New Lesson</h3>
          <form onSubmit={handleAddLesson} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Lesson Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Introduction to Web Development"
                className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Brief description of what students will learn..."
                className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                rows={3}
                value={newLessonDescription}
                onChange={(e) => setNewLessonDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                YouTube URL
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                value={newLessonYoutubeUrl}
                onChange={(e) => setNewLessonYoutubeUrl(e.target.value)}
              />
              <p className="text-xs text-neutral-500 mt-1.5">YouTube video will be automatically embedded</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Duration Label
              </label>
              <input
                type="text"
                placeholder="e.g. 15 min, 45 min"
                className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                value={newLessonDuration}
                onChange={(e) => setNewLessonDuration(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Adding...' : 'Add Lesson'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddLesson(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Video className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No lessons yet</h3>
          <p className="text-neutral-500 mb-4">Start building your curriculum by adding your first lesson</p>
          <button
            onClick={() => setShowAddLesson(true)}
            className="px-6 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
          >
            Add Your First Lesson
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.uuid_id}
              className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Drag Handle */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => handleMoveLesson(lesson.uuid_id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <GripVertical className="w-4 h-4 text-neutral-300" />
                  <button
                    onClick={() => handleMoveLesson(lesson.uuid_id, 'down')}
                    disabled={index === lessons.length - 1}
                    className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Lesson Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-neutral-500">
                          Lesson {index + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            lesson.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {lesson.status}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-neutral-900 truncate">
                        {lesson.title}
                      </h4>
                      {lesson.description && (
                        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}
                      {lesson.youtube_url && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-neutral-500">
                          <Video className="w-4 h-4" />
                          <span className="truncate">YouTube video included</span>
                        </div>
                      )}
                      {lesson.duration_label && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.duration_label}</span>
                        </div>
                      )}

                      {/* Quiz and Assignment indicators */}
                      <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
                        <button
                          onClick={() => {
                            setQuizLessonId(lesson.uuid_id);
                            setShowAddQuiz(true);
                          }}
                          className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>Add Quiz</span>
                        </button>
                        <button
                          onClick={() => {
                            setAssignmentLessonId(lesson.uuid_id);
                            setShowAddAssignment(true);
                          }}
                          className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Add Assignment</span>
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(lesson.uuid_id, lesson.status)}
                        className="p-2 text-neutral-500 hover:text-sky-600 transition-colors"
                        title={lesson.status === 'DRAFT' ? 'Publish' : 'Unpublish'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditLesson(lesson)}
                        className="p-2 text-neutral-500 hover:text-sky-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.uuid_id)}
                        className="p-2 text-neutral-500 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Edit Lesson</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Lesson Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Description
                </label>
                <textarea
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  YouTube URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  value={editYoutubeUrl}
                  onChange={(e) => setEditYoutubeUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Duration Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15 min, 45 min"
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsRequired"
                  checked={editIsRequired}
                  onChange={(e) => setEditIsRequired(e.target.checked)}
                  className="w-4 h-4 text-sky-600 border-neutral-300 rounded focus:ring-sky-500"
                />
                <label htmlFor="editIsRequired" className="text-sm text-neutral-700">
                  Required for completion
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Quiz Modal */}
      {showAddQuiz && quizLessonId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Add Quiz to Lesson</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddQuiz(quizLessonId); }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lesson 1 Quiz"
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of the quiz..."
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  rows={2}
                  value={newQuizDescription}
                  onChange={(e) => setNewQuizDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional"
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                    value={newQuizTimeLimit}
                    onChange={(e) => setNewQuizTimeLimit(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                    value={newQuizPassingScore}
                    onChange={(e) => setNewQuizPassingScore(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Adding...' : 'Add Quiz'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddQuiz(false);
                    setQuizLessonId(null);
                    setNewQuizTitle('');
                    setNewQuizDescription('');
                    setNewQuizTimeLimit('');
                    setNewQuizPassingScore('70');
                  }}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddAssignment && assignmentLessonId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Add Assignment to Lesson</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddAssignment(assignmentLessonId); }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Submission"
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  value={newAssignmentTitle}
                  onChange={(e) => setNewAssignmentTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of the assignment..."
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  rows={2}
                  value={newAssignmentDescription}
                  onChange={(e) => setNewAssignmentDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Instructions
                </label>
                <textarea
                  placeholder="Detailed instructions for students..."
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  rows={3}
                  value={newAssignmentInstructions}
                  onChange={(e) => setNewAssignmentInstructions(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Submission Type
                </label>
                <select
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  value={newAssignmentType}
                  onChange={(e) => setNewAssignmentType(e.target.value)}
                >
                  <option value="url">URL</option>
                  <option value="screenshot">Screenshot</option>
                  <option value="both">Both URL and Screenshot</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    Max Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                    value={newAssignmentMaxScore}
                    onChange={(e) => setNewAssignmentMaxScore(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="newAssignmentRequired"
                    checked={newAssignmentRequired}
                    onChange={(e) => setNewAssignmentRequired(e.target.checked)}
                    className="w-4 h-4 text-sky-600 border-neutral-300 rounded focus:ring-sky-500"
                  />
                  <label htmlFor="newAssignmentRequired" className="text-sm text-neutral-700">
                    Required
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Adding...' : 'Add Assignment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAssignment(false);
                    setAssignmentLessonId(null);
                    setNewAssignmentTitle('');
                    setNewAssignmentDescription('');
                    setNewAssignmentInstructions('');
                    setNewAssignmentType('url');
                    setNewAssignmentRequired(true);
                    setNewAssignmentMaxScore('100');
                  }}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
