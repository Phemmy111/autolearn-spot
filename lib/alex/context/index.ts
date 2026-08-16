/**
 * ALEX Platform Context Assembly
 * 
 * Main entry point for loading platform context for ALEX.
 * Coordinates context routing, loading, and sanitization.
 */

import { PlatformContext, ContextRequest, ContextResult } from './context-types';
import { routeContext, ContextType as ContextTypeEnum } from './context-router';
import { getUserProfileContext } from './profile-context';
import { getEnrollmentContext } from './enrollment-context';
import { getLearningContext } from './learning-context';
import { getScholarshipContext } from './scholarship-context';
import { getCertificateContext } from './certificate-context';
import { alexLogger } from '../logger';

/**
 * Load platform context for an authenticated user's request
 */
export async function loadPlatformContext(request: ContextRequest): Promise<ContextResult> {
  const { userId, userEmail, userName, userIntent, conversationMode } = request;
  
  // Use email prefix as fallback name if not provided
  const finalUserName = userName || (userEmail ? userEmail.split('@')[0] : undefined);
  
  alexLogger.info('CONTEXT', 'Loading platform context', { userId, userIntent, conversationMode });

  // Route the request to determine which contexts are needed
  const routing = routeContext(request);
  
  alexLogger.debug('CONTEXT', 'Context routing result', { 
    required: routing.requiredContexts, 
    optional: routing.optionalContexts 
  });

  const platformContext: PlatformContext = {};
  const unavailableContexts: string[] = [];
  const errors: any[] = [];

  // Load required contexts
  for (const contextType of routing.requiredContexts) {
    try {
      const result = await loadContext(contextType, userId, userEmail, finalUserName);
      
      if (result.error) {
        errors.push(result.error);
        if (result.error.isCritical) {
          unavailableContexts.push(contextType);
        }
      }
      
      if (result.context) {
        // Map context type to PlatformContext property name
        const propertyName = getContextPropertyName(contextType);
        platformContext[propertyName as keyof PlatformContext] = result.context;
      }
    } catch (error) {
      alexLogger.error('CONTEXT', `Failed to load ${contextType} context`, { error });
      errors.push({
        contextType,
        error: error instanceof Error ? error.message : 'Unknown error',
        isCritical: false
      });
    }
  }

  // Load optional contexts (non-blocking)
  for (const contextType of routing.optionalContexts) {
    try {
      const result = await loadContext(contextType, userId, userEmail, finalUserName);
      
      if (result.error) {
        // Optional context errors are logged but don't block
        alexLogger.warn('CONTEXT', `Optional ${contextType} context unavailable`, { error: result.error.error });
      }
      
      if (result.context) {
        // Map context type to PlatformContext property name
        const propertyName = getContextPropertyName(contextType);
        platformContext[propertyName as keyof PlatformContext] = result.context;
      }
    } catch (error) {
      // Optional context errors are silently ignored
      alexLogger.debug('CONTEXT', `Optional ${contextType} context failed`, { error });
    }
  }

  alexLogger.info('CONTEXT', 'Platform context loaded', { 
    contextTypes: Object.keys(platformContext),
    unavailable: unavailableContexts,
    errorCount: errors.length
  });

  return {
    context: platformContext,
    unavailableContexts,
    errors,
  };
}

/**
 * Map context type string to PlatformContext property name
 */
function getContextPropertyName(contextType: ContextTypeEnum): string {
  switch (contextType) {
    case 'profile':
      return 'user';
    case 'enrollment':
      return 'enrollments';
    case 'scholarship':
      return 'scholarships';
    case 'certificate':
      return 'certificates';
    default:
      return contextType;
  }
}

/**
 * Load a specific context type
 */
async function loadContext(
  contextType: ContextTypeEnum,
  userId: string,
  userEmail?: string,
  userName?: string
): Promise<{ context: any; error: any }> {
  switch (contextType) {
    case 'profile':
      return await getUserProfileContext(userId, userEmail, userName);
    case 'enrollment':
      return await getEnrollmentContext(userId, userEmail);
    case 'learning':
      return await getLearningContext(userId, userEmail);
    case 'scholarship':
      return await getScholarshipContext(userId, userEmail);
    case 'certificate':
      return await getCertificateContext(userId);
    default:
      return {
        context: null,
        error: {
          contextType,
          error: `Unknown context type: ${contextType}`,
          isCritical: false
        }
      };
  }
}

/**
 * Format platform context for inclusion in AI prompt
 * This creates a clear, structured representation of platform data
 */
export function formatPlatformContextForPrompt(context: PlatformContext): string {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }

  let prompt = '\n=== AUTOLEARN SPOT PLATFORM CONTEXT ===\n';
  prompt += 'The following information is from the user\'s actual AutoLearn Spot account.\n';
  prompt += 'This data is authoritative for platform-specific questions.\n\n';

  if (context.user) {
    prompt += '--- User Profile ---\n';
    prompt += `Name: ${context.user.fullName || 'Not provided'}\n`;
    if (context.user.email) {
      prompt += `Email: ${context.user.email}\n`;
    }
    prompt += '\n';
  }

  if (context.enrollments && context.enrollments.length > 0) {
    prompt += '--- Enrollments ---\n';
    context.enrollments.forEach(enrollment => {
      prompt += `Course: ${enrollment.cohortName}\n`;
      prompt += `Status: ${enrollment.status}\n`;
      if (enrollment.enrolledDate) {
        prompt += `Enrolled: ${new Date(enrollment.enrolledDate).toLocaleDateString()}\n`;
      }
      prompt += '\n';
    });
  }

  if (context.learning) {
    prompt += '--- Learning Progress ---\n';
    prompt += `Course: ${context.learning.currentCohortName}\n`;
    prompt += `Progress: ${context.learning.progressPercentage}% (${context.learning.completedLessons}/${context.learning.totalLessons} lessons)\n`;
    
    if (context.learning.currentLesson) {
      prompt += `Current Lesson: ${context.learning.currentLesson.title} (Week ${context.learning.currentLesson.weekNumber}, Session ${context.learning.currentLesson.sessionNumber})\n`;
    }
    
    if (context.learning.nextLesson) {
      prompt += `Next Lesson: ${context.learning.nextLesson.title} (Week ${context.learning.nextLesson.weekNumber}, Session ${context.learning.nextLesson.sessionNumber})\n`;
    }
    
    if (context.learning.recentLessonProgress.length > 0) {
      prompt += 'Recent Activity:\n';
      context.learning.recentLessonProgress.slice(0, 3).forEach(progress => {
        prompt += `- ${progress.lessonTitle} (Week ${progress.weekNumber}): ${progress.completed ? 'Completed' : `${progress.watchPercentage}% watched`}\n`;
      });
    }
    prompt += '\n';
  }

  if (context.scholarships && context.scholarships.hasApplications) {
    prompt += '--- Scholarship Applications ---\n';
    if (context.scholarships.applicationStatus) {
      prompt += `Status: ${context.scholarships.applicationStatus}\n`;
    }
    context.scholarships.applications.forEach(app => {
      prompt += `Reference: ${app.referenceNumber}\n`;
      if (app.statusDescription) {
        prompt += `Details: ${app.statusDescription}\n`;
      }
      if (app.paymentStatus) {
        prompt += `Payment Status: ${app.paymentStatus}\n`;
      }
      if (app.paymentDate) {
        prompt += `Payment Date: ${new Date(app.paymentDate).toLocaleDateString()}\n`;
      }
      prompt += '\n';
    });
  } else if (context.scholarships && !context.scholarships.hasApplications) {
    prompt += '--- Scholarship Applications ---\n';
    prompt += 'No scholarship application on file\n\n';
  }

  if (context.certificates && context.certificates.hasCertificate) {
    prompt += '--- Certificates ---\n';
    context.certificates.certificates.forEach(cert => {
      prompt += `Certificate: ${cert.certificateCode}\n`;
      prompt += `Course: ${cert.cohortName}\n`;
      prompt += `Issued: ${new Date(cert.issuedDate).toLocaleDateString()}\n`;
      if (cert.isRevoked) {
        prompt += 'Status: Revoked\n';
      }
      prompt += '\n';
    });
  }

  prompt += '=== END PLATFORM CONTEXT ===\n';

  return prompt;
}