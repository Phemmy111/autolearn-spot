/**
 * ALEX Platform Context Types
 * 
 * Sanitized types for platform data that can be safely provided to AI models.
 * These types exclude sensitive fields and internal metadata.
 */

export interface PlatformContext {
  user?: UserProfileContext;
  enrollments?: EnrollmentContext[];
  learning?: LearningContext;
  scholarships?: ScholarshipContext;
  certificates?: CertificateContext;
}

export interface UserProfileContext {
  userId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  // Only non-sensitive profile information
}

export interface EnrollmentContext {
  enrollmentId: string;
  cohortId: string;
  cohortName: string;
  cohortSlug: string;
  status: 'pending' | 'active' | 'revoked';
  enrolledDate?: string;
  isCurrentCohort: boolean;
}

export interface LearningContext {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  recentLessonProgress: LessonProgressItem[];
  currentCohortId: string;
  currentCohortName: string;
  allLessons: LessonInfo[];
  currentLesson?: LessonInfo;
  nextLesson?: LessonInfo;
}

export interface LessonProgressItem {
  lessonId: string;
  lessonTitle: string;
  weekNumber: number;
  completed: boolean;
  watchPercentage: number;
  lastPosition?: number;
}

export interface LessonInfo {
  lessonId: string;
  title: string;
  weekNumber: number;
  sessionNumber: number;
  orderIndex: number;
  completed: boolean;
  watchPercentage: number;
  available: boolean;
}

export interface ScholarshipContext {
  hasApplications: boolean;
  applications: ScholarshipApplication[];
  hasActiveApplication: boolean;
  applicationStatus: string;
}

export interface ScholarshipApplication {
  referenceNumber: string;
  status: string;
  statusDescription?: string;
  submittedDate: string;
  paymentStatus?: string;
  paymentDate?: string;
  applicantName?: string;
}

export interface CertificateContext {
  hasCertificate: boolean;
  certificates: CertificateInfo[];
}

export interface CertificateInfo {
  certificateCode: string;
  cohortName: string;
  issuedDate: string;
  isRevoked: boolean;
  verificationUrl?: string;
}

export interface ContextRequest {
  userId: string;
  userEmail?: string;
  userIntent?: string;
  conversationMode?: string;
}

export interface ContextResult {
  context: PlatformContext;
  unavailableContexts: string[];
  errors: ContextError[];
}

export interface ContextError {
  contextType: string;
  error: string;
  isCritical: boolean;
}