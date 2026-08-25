/**
 * ALEX Question Tracker
 * 
 * Prevents repeated questions by tracking question history
 * Uses semantic fingerprinting to detect similar questions
 */

export interface QuestionRecord {
  question: string;
  context: string;
  askedAt: string;
  answered?: boolean;
  answer?: string;
  answeredAt?: string;
}

export class QuestionTracker {
  private askedQuestions: Map<string, QuestionRecord>;
  
  constructor() {
    this.askedQuestions = new Map();
  }
  
  /**
   * Generate semantic fingerprint for a question
   * Simplified version - can be enhanced with AI for better semantic matching
   */
  private generateFingerprint(question: string, context: string): string {
    const normalized = `${question.toLowerCase().trim()}:${context.toLowerCase().trim()}`;
    // Simple hash for now - could use AI semantic similarity in future
    return this.simpleHash(normalized);
  }
  
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
  
  /**
   * Check if a question has already been asked
   */
  checkAlreadyAsked(question: string, context: string): boolean {
    const fingerprint = this.generateFingerprint(question, context);
    return this.askedQuestions.has(fingerprint);
  }
  
  /**
   * Check if a question has already been answered
   */
  checkAlreadyAnswered(question: string, context: string): boolean {
    const fingerprint = this.generateFingerprint(question, context);
    const record = this.askedQuestions.get(fingerprint);
    return record?.answered === true;
  }
  
  /**
   * Record that a question was asked
   */
  recordQuestion(question: string, context: string): void {
    const fingerprint = this.generateFingerprint(question, context);
    this.askedQuestions.set(fingerprint, {
      question,
      context,
      askedAt: new Date().toISOString(),
      answered: false
    });
    
    console.log('[Question Tracker] Question recorded:', {
      question: question.substring(0, 50),
      fingerprint
    });
  }
  
  /**
   * Record that a question was answered
   */
  recordAnswer(question: string, answer: string): void {
    // Find the record by question text (fuzzy match)
    for (const [fingerprint, record] of this.askedQuestions.entries()) {
      if (record.question.toLowerCase().includes(question.toLowerCase()) ||
          question.toLowerCase().includes(record.question.toLowerCase())) {
        record.answered = true;
        record.answer = answer;
        record.answeredAt = new Date().toISOString();
        
        console.log('[Question Tracker] Answer recorded:', {
          question: question.substring(0, 50),
          answer: answer.substring(0, 50),
          fingerprint
        });
        return;
      }
    }
    
    console.warn('[Question Tracker] No matching question found for answer:', question.substring(0, 50));
  }
  
  /**
   * Determine if a question should be asked
   * Returns false if already asked and answered
   */
  shouldAsk(question: string, context: string): boolean {
    // Check if already asked and answered
    if (this.checkAlreadyAnswered(question, context)) {
      console.log('[Question Tracker] Question already answered, skipping:', question.substring(0, 50));
      return false;
    }
    
    // Check if recently asked (within last 3 messages)
    const fingerprint = this.generateFingerprint(question, context);
    const record = this.askedQuestions.get(fingerprint);
    if (record && !record.answered) {
      const askedTime = new Date(record.askedAt).getTime();
      const now = Date.now();
      const timeSinceAsked = now - askedTime;
      
      // If asked within last 5 minutes and not answered, don't ask again
      if (timeSinceAsked < 5 * 60 * 1000) {
        console.log('[Question Tracker] Question recently asked and unanswered, skipping:', question.substring(0, 50));
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get all unanswered questions
   */
  getUnansweredQuestions(): QuestionRecord[] {
    return Array.from(this.askedQuestions.values()).filter(record => !record.answered);
  }
  
  /**
   * Clear old questions (older than 1 hour)
   */
  clearOldQuestions(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [fingerprint, record] of this.askedQuestions.entries()) {
      const askedTime = new Date(record.askedAt).getTime();
      if (askedTime < oneHourAgo && record.answered) {
        this.askedQuestions.delete(fingerprint);
      }
    }
    
    console.log('[Question Tracker] Cleared old questions, remaining:', this.askedQuestions.size);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const records = Array.from(this.askedQuestions.values());
    return {
      totalAsked: records.length,
      answered: records.filter(r => r.answered).length,
      unanswered: records.filter(r => !r.answered).length,
      recentUnanswered: records.filter(r => !r.answered && 
        (Date.now() - new Date(r.askedAt).getTime()) < 5 * 60 * 1000).length
    };
  }
}