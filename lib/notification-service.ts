import { supabaseAdmin } from '@/lib/supabase';
import { PushNotificationService } from '@/lib/push-notification-service';
import { EmailService } from '@/lib/email-service';

/**
 * Centralized notification service for all application events
 * Handles both push notifications and email notifications
 */
export class NotificationService {
  /**
   * Send notification for new assignment
   */
  static async sendNewAssignmentNotification(
    studentId: string,
    assignmentTitle: string,
    courseTitle: string,
    authorId: string
  ): Promise<void> {
    try {
      // Get student info
      const { data: student } = await supabaseAdmin
        .from('enrollments')
        .select('full_name, email')
        .eq('clerk_user_id', studentId)
        .single();

      if (!student) return;

      // Send push notification
      await PushNotificationService.sendNotification(studentId, {
        title: 'New Assignment Posted',
        body: `New assignment "${assignmentTitle}" has been posted for ${courseTitle}`,
        data: {
          type: 'new_assignment',
          assignmentTitle,
          courseTitle,
        },
      });

      // Send email notification
      await EmailService.sendEmailMultiple({
        to: [student.email],
        subject: `New Assignment: ${assignmentTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">New Assignment Posted</h2>
            <p>A new assignment has been posted for your course.</p>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Assignment:</strong> ${assignmentTitle}</p>
              <p><strong>Course:</strong> ${courseTitle}</p>
            </div>
            <p>Please log in to view and complete the assignment.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send new assignment notification:', error);
    }
  }

  /**
   * Send notification for quiz submission
   */
  static async sendQuizSubmissionNotification(
    studentId: string,
    studentName: string,
    quizTitle: string,
    score: number,
    authorId: string
  ): Promise<void> {
    try {
      // Get author info
      const { data: author } = await supabaseAdmin
        .from('authors')
        .select('display_name, email')
        .eq('id', authorId)
        .single();

      if (!author) return;

      // Send push notification to author
      await PushNotificationService.sendNotification(author.clerk_user_id, {
        title: 'Quiz Submitted',
        body: `${studentName} has submitted quiz: ${quizTitle}`,
        data: {
          type: 'quiz_submission',
          studentName,
          quizTitle,
          score,
        },
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send quiz submission notification:', error);
    }
  }

  /**
   * Send notification for course enrollment
   */
  static async sendCourseEnrollmentNotification(
    studentId: string,
    studentName: string,
    courseTitle: string,
    authorId: string
  ): Promise<void> {
    try {
      // Get author info
      const { data: author } = await supabaseAdmin
        .from('authors')
        .select('display_name, email')
        .eq('id', authorId)
        .single();

      if (!author) return;

      // Send push notification to author
      await PushNotificationService.sendNotification(author.clerk_user_id, {
        title: 'New Student Enrolled',
        body: `${studentName} has enrolled in ${courseTitle}`,
        data: {
          type: 'course_enrollment',
          studentName,
          courseTitle,
        },
      });

      // Send email notification using existing service
      await EmailService.sendNewStudentEnrollmentNotification(
        studentId,
        studentName,
        courseTitle
      );
    } catch (error) {
      console.error('[NotificationService] Failed to send enrollment notification:', error);
    }
  }

  /**
   * Send notification for withdrawal request
   */
  static async sendWithdrawalRequestNotification(
    authorId: string,
    authorName: string,
    amount: number
  ): Promise<void> {
    try {
      // Send push notification using existing service
      await PushNotificationService.sendNotificationToUserType('admin', {
        title: 'New Withdrawal Request',
        body: `${authorName} has requested a withdrawal of ₦${amount.toLocaleString()}`,
        data: {
          type: 'withdrawal_request',
          authorName,
          amount,
        },
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send withdrawal notification:', error);
    }
  }

  /**
   * Send notification for product approval
   */
  static async sendProductApprovalNotification(
    authorId: string,
    productTitle: string,
    status: 'PUBLISHED' | 'REJECTED',
    feedback?: string
  ): Promise<void> {
    try {
      const { data: author } = await supabaseAdmin
        .from('authors')
        .select('display_name, email')
        .eq('id', authorId)
        .single();

      if (!author) return;

      const title = status === 'PUBLISHED' ? 'Product Published' : 'Product Review Update';
      const body = status === 'PUBLISHED'
        ? `Your product "${productTitle}" has been published!`
        : `Your product "${productTitle}" was ${status.toLowerCase()}. ${feedback || ''}`;

      // Send push notification
      await PushNotificationService.sendNotification(author.clerk_user_id, {
        title,
        body,
        data: {
          type: 'product_approval',
          productTitle,
          status,
          feedback,
        },
      });

      // Email is already handled by existing service
    } catch (error) {
      console.error('[NotificationService] Failed to send product approval notification:', error);
    }
  }

  /**
   * Send notification for course completion
   */
  static async sendCourseCompletionNotification(
    studentId: string,
    studentName: string,
    courseTitle: string,
    authorId: string
  ): Promise<void> {
    try {
      // Send push notification to student
      await PushNotificationService.sendNotification(studentId, {
        title: '🎉 Course Completed!',
        body: `Congratulations! You have completed ${courseTitle}`,
        data: {
          type: 'course_completion',
          courseTitle,
        },
      });

      // Send push notification to author
      await PushNotificationService.sendNotification(authorId, {
        title: 'Student Completed Course',
        body: `${studentName} has completed ${courseTitle}`,
        data: {
          type: 'course_completion',
          studentName,
          courseTitle,
        },
      });

      // Email is already handled by existing service
    } catch (error) {
      console.error('[NotificationService] Failed to send course completion notification:', error);
    }
  }
}
