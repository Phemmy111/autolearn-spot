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
      'enrolled', 'enrollment', 'course', 'signed up', 'registered', 'my course',
      'which course', 'what course', 'my enrollment status'
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

  // Always include profile, enrollment, learning, and certificate so Alex ALWAYS has student context!
  const requiredContexts: ContextType[] = ['profile', 'enrollment', 'learning', 'certificate'];
  const optionalContexts: ContextType[] = [];

  const scholarshipKeywords = ['scholarship', 'application', 'eligible', 'financial aid', 'discount', 'payment', 'fee', 'cost'];
  if (scholarshipKeywords.some(keyword => intent.includes(keyword))) {
    requiredContexts.push('scholarship');
  }

  return {
    requiredContexts,
    optionalContexts,
  };
}