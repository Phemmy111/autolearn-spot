"use client";
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, Plus, Trash2, Edit, Eye, Video, Clock, GripVertical, FileText, HelpCircle, Sparkles } from 'lucide-react';

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

  // AI Quiz generation state
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiLessonId, setAiLessonId] = useState<string | null>(null);
  const [aiScript, setAiScript] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(10);
  const [aiProviders, setAiProviders] = useState<any[]>([]);
  const [aiPrompts, setAiPrompts] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [fetchingModels, setFetchingModels] = useState(false);

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
    fetchAIProviders();
    fetchAIPrompts();
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
      const res = await fetch(`/api/author/products/${productId}/lessons/${editingLesson.id}`, {
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

  const fetchAIProviders = async () => {
    try {
      const res = await fetch('/api/author/ai-providers');
      if (res.ok) {
        const data = await res.json();
        setAiProviders(data.providers || []);
        
        // Auto-select default provider
        const defaultProvider = data.providers?.find((p: any) => p.is_default);
        if (defaultProvider) {
          setSelectedProviderId(defaultProvider.id);
          setSelectedModel(defaultProvider.default_model || '');
        } else if (data.providers?.length > 0) {
          setSelectedProviderId(data.providers[0].id);
          setSelectedModel(data.providers[0].default_model || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI providers:', err);
    }
  };

  const fetchAIPrompts = async () => {
    try {
      const res = await fetch('/api/author/ai-prompts');
      if (res.ok) {
        const data = await res.json();
        const quizPrompts = (data.prompts || []).filter((p: any) => p.prompt_type === 'quiz_generation');
        setAiPrompts(quizPrompts);
        
        // Auto-select active prompt
        const activePrompt = quizPrompts.find((p: any) => p.is_active);
        if (activePrompt) {
          setSelectedPromptId(activePrompt.id);
        } else if (quizPrompts.length > 0) {
          setSelectedPromptId(quizPrompts[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI prompts:', err);
    }
  };

  const handleFetchModels = async () => {
    if (!selectedProviderId) {
      setError('Please select a provider first');
      return;
    }

    setFetchingModels(true);
    try {
      const res = await fetch(`/api/author/ai-providers/${selectedProviderId}/models`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.models && data.models.length > 0) {
        // Update the provider in the list with the new models
        setAiProviders(prev => prev.map(p => 
          p.id === selectedProviderId ? { ...p, models: data.models } : p
        ));
        setSelectedModel(data.models[0]);
      } else {
        setError('No models found or fetch failed');
      }
    } catch (err: any) {
      setError('Failed to fetch models: ' + err.message);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiScript.trim()) {
      setError('Please provide lesson script');
      return;
    }

    if (!selectedProviderId) {
      setError('Please select an AI provider');
      return;
    }

    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    setAiGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/author/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: aiScript,
          lessonId: aiLessonId,
          questionCount: aiQuestionCount,
          providerId: selectedProviderId,
          model: selectedModel,
          promptId: selectedPromptId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate quiz');
      }

      const data = await res.json();
      setGeneratedQuiz(data.quiz);
      setShowAIGenerate(false);
      setAiScript('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveGeneratedQuiz = async () => {
    if (!generatedQuiz || !aiLessonId) return;

    setSaving(true);
    try {
      // Create the quiz
      const res = await fetch(`/api/author/products/${productId}/lessons/${aiLessonId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedQuiz.title,
          description: generatedQuiz.description,
          time_limit: 30,
          passing_score: 70,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create quiz');
      }

      const quizData = await res.json();
      const quizId = quizData.quiz.id;

      // Create questions using the existing quiz API
      for (const question of generatedQuiz.questions) {
        const questionRes = await fetch(`/api/author/products/${productId}/lessons/${aiLessonId}/quizzes/${quizId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(question),
        });

        if (!questionRes.ok) {
          const errorData = await questionRes.json();
          throw new Error(errorData.error || 'Failed to create question');
        }
      }

      setGeneratedQuiz(null);
      fetchLessons();
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz');
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
                            setAiLessonId(lesson.uuid_id);
                            setShowAIGenerate(true);
                          }}
                          className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>AI Generate</span>
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

      {/* AI Quiz Generation Modal */}
      {showAIGenerate && aiLessonId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Quiz Generator
            </h3>
            
            {aiProviders.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No AI providers configured.{' '}
                  <a href="/author/ai-providers" className="underline hover:text-yellow-900">
                    Configure AI providers →
                  </a>
                </p>
              </div>
            )}

            {aiPrompts.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No quiz generation prompts configured.{' '}
                  <a href="/author/ai-prompts" className="underline hover:text-yellow-900">
                    Configure AI prompts →
                  </a>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Lesson Script <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Paste your lesson script or content here. The AI will analyze it and generate quiz questions..."
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  rows={8}
                  value={aiScript}
                  onChange={(e) => setAiScript(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    Question Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(parseInt(e.target.value) || 10)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    AI Provider
                  </label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                    value={selectedProviderId}
                    onChange={(e) => {
                      setSelectedProviderId(e.target.value);
                      const provider = aiProviders.find((p: any) => p.id === e.target.value);
                      setSelectedModel(provider?.default_model || '');
                    }}
                  >
                    {aiProviders.length === 0 ? (
                      <option value="">No providers</option>
                    ) : (
                      aiProviders.map((provider: any) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name} {provider.is_default && '(Default)'}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    Model
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      {selectedProviderId ? (
                        (() => {
                          const provider = aiProviders.find((p: any) => p.id === selectedProviderId);
                          const models = provider?.models || [];
                          if (models.length === 0) {
                            return <option value="">No models</option>;
                          }
                          return models.map((model: string) => (
                            <option key={model} value={model}>{model}</option>
                          ));
                        })()
                      ) : (
                        <option value="">Select provider first</option>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={handleFetchModels}
                      disabled={fetchingModels || !selectedProviderId}
                      className="px-3 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Fetch available models"
                    >
                      {fetchingModels ? '...' : 'Fetch'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    AI Prompt
                  </label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                    value={selectedPromptId}
                    onChange={(e) => setSelectedPromptId(e.target.value)}
                  >
                    {aiPrompts.length === 0 ? (
                      <option value="">No prompts</option>
                    ) : (
                      aiPrompts.map((prompt: any) => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name} (v{prompt.version}) {prompt.is_active && '(Active)'}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAIGenerate}
                  disabled={aiGenerating || !aiScript.trim() || aiProviders.length === 0}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiGenerating ? 'Generating...' : 'Generate Quiz'}
                </button>
                <button
                  onClick={() => {
                    setShowAIGenerate(false);
                    setAiLessonId(null);
                    setAiScript('');
                    setGeneratedQuiz(null);
                  }}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Quiz Review Modal */}
      {generatedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Review Generated Quiz</h3>
            
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                Quiz generated successfully! Review the questions below before saving.
              </p>
            </div>

            <div className="border border-neutral-200 bg-neutral-50 p-4 rounded-xl mb-4">
              <h4 className="font-bold text-neutral-900 mb-2">{generatedQuiz.title}</h4>
              <p className="text-sm text-neutral-600 mb-2">{generatedQuiz.description}</p>
              <p className="text-xs text-neutral-500">{generatedQuiz.questions.length} questions</p>
            </div>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {generatedQuiz.questions.map((question: any, index: number) => (
                <div key={index} className="border border-neutral-200 bg-neutral-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-neutral-900 mb-2">Q{index + 1}: {question.question_text}</p>
                  <p className="text-xs text-neutral-500">Type: {question.question_type} | Points: {question.points}</p>
                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {question.options.map((option: string, optIndex: number) => (
                        <p key={optIndex} className={`text-xs ${option === question.correct_answer ? 'text-emerald-600' : 'text-neutral-600'}`}>
                          {String.fromCharCode(65 + optIndex)}. {option} {option === question.correct_answer && '✓'}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveGeneratedQuiz}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Quiz'}
              </button>
              <button
                onClick={() => {
                  setGeneratedQuiz(null);
                  setShowAIGenerate(true);
                }}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={() => setGeneratedQuiz(null)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
