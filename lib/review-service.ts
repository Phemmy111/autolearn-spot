import { supabaseAdmin } from './supabase';

export interface CourseReview {
  id: string;
  course_id: string;
  course_title?: string;
  student_id: string;
  student_name: string;
  student_email?: string;
  student_avatar?: string;
  rating: number; // 1 to 5
  title?: string;
  content: string;
  lesson_id?: string;
  lesson_title?: string;
  status: 'approved' | 'pending' | 'rejected';
  featured?: boolean;
  created_at: string;
  updated_at: string;
}

const SETTINGS_KEY = 'live_course_reviews';

export class ReviewService {
  /**
   * Fetch all reviews stored in site_settings
   */
  static async getAllReviews(): Promise<CourseReview[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (error) {
        console.error('[ReviewService] Error loading reviews:', error);
        return [];
      }

      if (!data?.value) {
        return [];
      }

      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      if (!Array.isArray(parsed)) return [];

      return parsed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (e) {
      console.error('[ReviewService] getAllReviews parse error:', e);
      return [];
    }
  }

  /**
   * Get reviews for a specific course
   */
  static async getCourseReviews(courseId: string, approvedOnly = true): Promise<CourseReview[]> {
    const all = await this.getAllReviews();
    return all.filter(r => {
      const matchCourse = r.course_id === courseId ||
        (r.course_title && r.course_title.toLowerCase().includes(courseId.toLowerCase()));
      if (!matchCourse) return false;
      if (approvedOnly) return r.status === 'approved';
      return true;
    });
  }

  /**
   * Check if a specific student already submitted a review for a course
   */
  static async getStudentReviewForCourse(
    courseId: string,
    studentId: string,
    studentEmail?: string
  ): Promise<CourseReview | null> {
    const all = await this.getAllReviews();
    const existing = all.find(r => 
      (r.course_id === courseId) &&
      (r.student_id === studentId || (studentEmail && r.student_email?.toLowerCase() === studentEmail.toLowerCase()))
    );
    return existing || null;
  }

  /**
   * Create or update a review
   */
  static async submitReview(input: {
    course_id: string;
    course_title?: string;
    student_id: string;
    student_name: string;
    student_email?: string;
    student_avatar?: string;
    rating: number;
    title?: string;
    content: string;
    lesson_id?: string;
    lesson_title?: string;
  }): Promise<CourseReview> {
    const all = await this.getAllReviews();
    const now = new Date().toISOString();

    const existingIndex = all.findIndex(r => 
      r.course_id === input.course_id &&
      (r.student_id === input.student_id || (input.student_email && r.student_email?.toLowerCase() === input.student_email.toLowerCase()))
    );

    let review: CourseReview;

    if (existingIndex >= 0) {
      // Update existing review
      review = {
        ...all[existingIndex],
        course_title: input.course_title || all[existingIndex].course_title,
        student_name: input.student_name || all[existingIndex].student_name,
        student_email: input.student_email || all[existingIndex].student_email,
        student_avatar: input.student_avatar || all[existingIndex].student_avatar,
        rating: Math.max(1, Math.min(5, Math.round(input.rating))),
        title: input.title || all[existingIndex].title,
        content: input.content,
        lesson_id: input.lesson_id || all[existingIndex].lesson_id,
        lesson_title: input.lesson_title || all[existingIndex].lesson_title,
        status: 'approved', // Auto-approved on student submission
        updated_at: now,
      };
      all[existingIndex] = review;
    } else {
      // Create new review
      review = {
        id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        course_id: input.course_id,
        course_title: input.course_title || 'Course',
        student_id: input.student_id,
        student_name: input.student_name,
        student_email: input.student_email,
        student_avatar: input.student_avatar,
        rating: Math.max(1, Math.min(5, Math.round(input.rating))),
        title: input.title || '',
        content: input.content,
        lesson_id: input.lesson_id,
        lesson_title: input.lesson_title,
        status: 'approved', // Live reviews approved by default so students see instant feedback
        featured: false,
        created_at: now,
        updated_at: now,
      };
      all.unshift(review);
    }

    await this.persistReviews(all);
    return review;
  }

  /**
   * Update review status or featured flag (Admin moderation)
   */
  static async updateReview(id: string, updates: Partial<CourseReview>): Promise<CourseReview | null> {
    const all = await this.getAllReviews();
    const index = all.findIndex(r => r.id === id);
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await this.persistReviews(all);
    return all[index];
  }

  /**
   * Delete review (Admin moderation)
   */
  static async deleteReview(id: string): Promise<boolean> {
    const all = await this.getAllReviews();
    const filtered = all.filter(r => r.id !== id);
    if (filtered.length === all.length) return false;

    await this.persistReviews(filtered);
    return true;
  }

  /**
   * Internal helper to persist reviews in Supabase site_settings
   */
  private static async persistReviews(reviews: CourseReview[]): Promise<void> {
    const { data: existing } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    const jsonValue = JSON.stringify(reviews);
    const now = new Date().toISOString();

    if (existing) {
      await supabaseAdmin
        .from('site_settings')
        .update({
          value: jsonValue,
          updated_at: now,
        })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('site_settings')
        .insert({
          key: SETTINGS_KEY,
          value: jsonValue,
          created_at: now,
          updated_at: now,
        });
    }
  }
}
