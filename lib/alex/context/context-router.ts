/**
 * ALEX Context Router
 * 
 * Determines which platform contexts are relevant to a user's request.
 * This is deterministic and does not make additional LLM calls.
 * Uses keyword-based intent detection similar to the existing intent detector.
 */

import { ContextRequest } from './context-types';

export type ContextType = 'profile' | 'enrollment' | 'learning' | 'scholarship' | 'certificate';

export interface ContextRoutingResult {
  requiredContexts: ContextType[];
  optionalContexts: ContextType[];
}

export function routeContext(request: ContextRequest): ContextRoutingResult {
  const { userIntent, conversationMode } = request;
  const intent = (userIntent || '').toLowerCase();
  const mode = conversationMode || 'auto';

  // Context keywords for each context type
  const contextKeywords: Record<ContextType, string[]> = {
    profile: [
      'name', 'email', 'profile', 'personal information', 'about me', 'who am i',
      'my details', 'account', 'user', 'myself'
    ],
    enrollment: [
      'enrolled', 'enrollment', 'cohort', 'signed up', 'registered', 'my course',
      'which course', 'what cohort', 'my enrollment status'
    ],
    learning: [
      'progress', 'lesson', 'learning', 'study', 'complete', 'watch', 'video',
      'how far', 'percentage', 'completion', 'lesson progress', 'course progress',
      'study progress', 'watching', 'finished', 'remaining'
    ],
    scholarship: [
      'scholarship', 'application', 'eligible', 'financial aid', 'discount',
      'apply for scholarship', 'scholarship status', 'payment', 'fee', 'cost'
    ],
    certificate: [
      'certificate', 'certification', 'cert', 'verify', 'earned', 'receive',
      'when will i get my certificate', 'certificate status', 'certify'
    ],
  };

  // Determine required contexts based on intent keywords
  const requiredContexts: ContextType[] = [];
  const optionalContexts: ContextType[] = [];

  // Check each context type for keyword matches
  for (const [contextType, keywords] of Object.entries(contextKeywords)) {
    const hasKeyword = keywords.some(keyword => intent.includes(keyword));
    
    if (hasKeyword) {
      requiredContexts.push(contextType as ContextType);
    }
  }

  // Auto mode: Always include profile for personalization
  if (mode === 'auto') {
    if (!requiredContexts.includes('profile')) {
      optionalContexts.push('profile');
    }
    
    // In auto mode, learning context is often relevant
    if (!requiredContexts.includes('learning') && !requiredContexts.includes('enrollment')) {
      optionalContexts.push('learning');
    }
  }

  // Tutor mode: Learning context is often relevant
  if (mode === 'tutor' && !requiredContexts.includes('learning')) {
    optionalContexts.push('learning');
  }

  // Special cases that require multiple contexts
  const progressKeywords = ['progress', 'how far', 'completion', 'remaining'];
  const hasProgressKeyword = progressKeywords.some(keyword => intent.includes(keyword));
  
  if (hasProgressKeyword) {
    if (!requiredContexts.includes('learning')) {
      requiredContexts.push('learning');
    }
    if (!requiredContexts.includes('enrollment')) {
      optionalContexts.push('enrollment');
    }
  }

  const certificateProgressKeywords = ['certificate', 'when will i get', 'eligible for certificate'];
  const hasCertProgressKeyword = certificateProgressKeywords.some(keyword => intent.includes(keyword));
  
  if (hasCertProgressKeyword) {
    if (!requiredContexts.includes('certificate')) {
      requiredContexts.push('certificate');
    }
    if (!requiredContexts.includes('learning')) {
      optionalContexts.push('learning');
    }
  }

  return {
    requiredContexts,
    optionalContexts,
  };
}