/**
 * ALEX Orchestration Question Service
 * 
 * Persistent question tracking for AI-driven orchestration
 * Replaces in-memory QuestionTracker with database persistence
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for orchestration question service')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface OrchestrationQuestion {
  id: string
  conversation_id: string
  user_id: string
  build_id?: string
  question: string
  question_context?: string
  question_type: string
  answer?: string
  answered_at?: string
  is_answered: boolean
  relevance_status: string
  orchestration_action?: string
  created_at: string
  updated_at: string
}

export class OrchestrationQuestionService {
  /**
   * Record that a question was asked
   */
  static async recordQuestion(params: {
    conversationId: string
    userId: string
    buildId?: string
    question: string
    questionContext?: string
    questionType?: string
    orchestrationAction?: string
  }): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('alex_orchestration_questions')
        .insert({
          conversation_id: params.conversationId,
          user_id: params.userId,
          build_id: params.buildId,
          question: params.question,
          question_context: params.questionContext,
          question_type: params.questionType || 'clarify',
          orchestration_action: params.orchestrationAction,
          is_answered: false,
          relevance_status: 'active'
        })
      
      if (error) {
        console.error('[Orchestration Question Service] Failed to record question:', error)
        throw error
      }
      
      console.log('[Orchestration Question Service] Question recorded:', {
        question: params.question.substring(0, 50),
        conversationId: params.conversationId
      })
    } catch (error) {
      console.error('[Orchestration Question Service] Error recording question:', error)
      throw error
    }
  }
  
  /**
   * Record that a question was answered
   */
  static async recordAnswer(params: {
    conversationId: string
    userId: string
    question: string
    answer: string
  }): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      
      // Find the most recent matching unanswered question
      const { data: questions, error: fetchError } = await supabase
        .from('alex_orchestration_questions')
        .select('*')
        .eq('conversation_id', params.conversationId)
        .eq('user_id', params.userId)
        .eq('is_answered', false)
        .eq('relevance_status', 'active')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (fetchError) {
        console.error('[Orchestration Question Service] Failed to fetch questions:', fetchError)
        throw fetchError
      }
      
      // Find fuzzy match by question text
      const matchingQuestion = questions?.find(q => 
        q.question.toLowerCase().includes(params.question.toLowerCase()) ||
        params.question.toLowerCase().includes(q.question.toLowerCase())
      )
      
      if (matchingQuestion) {
        const { error: updateError } = await supabase
          .from('alex_orchestration_questions')
          .update({
            answer: params.answer,
            answered_at: new Date().toISOString(),
            is_answered: true,
            relevance_status: 'resolved',
            updated_at: new Date().toISOString()
          })
          .eq('id', matchingQuestion.id)
        
        if (updateError) {
          console.error('[Orchestration Question Service] Failed to record answer:', updateError)
          throw updateError
        }
        
        console.log('[Orchestration Question Service] Answer recorded:', {
          question: params.question.substring(0, 50),
          answer: params.answer.substring(0, 50)
        })
      } else {
        console.warn('[Orchestration Question Service] No matching question found for answer:', params.question.substring(0, 50))
      }
    } catch (error) {
      console.error('[Orchestration Question Service] Error recording answer:', error)
      throw error
    }
  }
  
  /**
   * Check if a question has already been asked
   */
  static async checkAlreadyAsked(params: {
    conversationId: string
    userId: string
    question: string
    questionContext?: string
  }): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()
      
      // Check for similar questions asked in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      const { data: questions, error } = await supabase
        .from('alex_orchestration_questions')
        .select('*')
        .eq('conversation_id', params.conversationId)
        .eq('user_id', params.userId)
        .eq('relevance_status', 'active')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('[Orchestration Question Service] Failed to check already asked:', error)
        return false
      }
      
      // Check for fuzzy match
      const similarQuestion = questions?.find(q => 
        q.question.toLowerCase().includes(params.question.toLowerCase()) ||
        params.question.toLowerCase().includes(q.question.toLowerCase())
      )
      
      return !!similarQuestion
    } catch (error) {
      console.error('[Orchestration Question Service] Error checking already asked:', error)
      return false
    }
  }
  
  /**
   * Check if a question has already been answered
   */
  static async checkAlreadyAnswered(params: {
    conversationId: string
    userId: string
    question: string
    questionContext?: string
  }): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()
      
      const { data: questions, error } = await supabase
        .from('alex_orchestration_questions')
        .select('*')
        .eq('conversation_id', params.conversationId)
        .eq('user_id', params.userId)
        .eq('is_answered', true)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) {
        console.error('[Orchestration Question Service] Failed to check already answered:', error)
        return false
      }
      
      // Check for fuzzy match
      const answeredQuestion = questions?.find(q => 
        q.question.toLowerCase().includes(params.question.toLowerCase()) ||
        params.question.toLowerCase().includes(q.question.toLowerCase())
      )
      
      return !!answeredQuestion
    } catch (error) {
      console.error('[Orchestration Question Service] Error checking already answered:', error)
      return false
    }
  }
  
  /**
   * Determine if a question should be asked
   */
  static async shouldAsk(params: {
    conversationId: string
    userId: string
    question: string
    questionContext?: string
  }): Promise<boolean> {
    // Check if already answered
    const alreadyAnswered = await this.checkAlreadyAnswered(params)
    if (alreadyAnswered) {
      console.log('[Orchestration Question Service] Question already answered, skipping:', params.question.substring(0, 50))
      return false
    }
    
    // Check if recently asked and unanswered
    const alreadyAsked = await this.checkAlreadyAsked(params)
    if (alreadyAsked) {
      console.log('[Orchestration Question Service] Question recently asked and unanswered, skipping:', params.question.substring(0, 50))
      return false
    }
    
    return true
  }
  
  /**
   * Get unanswered questions for a conversation
   */
  static async getUnansweredQuestions(params: {
    conversationId: string
    userId: string
  }): Promise<OrchestrationQuestion[]> {
    try {
      const supabase = getSupabaseClient()
      
      const { data, error } = await supabase
        .from('alex_orchestration_questions')
        .select('*')
        .eq('conversation_id', params.conversationId)
        .eq('user_id', params.userId)
        .eq('is_answered', false)
        .eq('relevance_status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('[Orchestration Question Service] Failed to get unanswered questions:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('[Orchestration Question Service] Error getting unanswered questions:', error)
      return []
    }
  }
  
  /**
   * Clear old questions (older than 1 hour and answered)
   */
  static async clearOldQuestions(params: {
    conversationId: string
    userId: string
  }): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      const { error } = await supabase
        .from('alex_orchestration_questions')
        .update({
          relevance_status: 'obsolete',
          updated_at: new Date().toISOString()
        })
        .eq('conversation_id', params.conversationId)
        .eq('user_id', params.userId)
        .eq('is_answered', true)
        .lt('created_at', oneHourAgo)
      
      if (error) {
        console.error('[Orchestration Question Service] Failed to clear old questions:', error)
        throw error
      }
      
      console.log('[Orchestration Question Service] Old questions cleared')
    } catch (error) {
      console.error('[Orchestration Question Service] Error clearing old questions:', error)
      throw error
    }
  }
  
  /**
   * Get statistics
   */
  static async getStats(params: {
    conversationId: string
    userId: string
  }): Promise<{
    totalAsked: number
    answered: number
    unanswered: number
    recentUnanswered: number
  }> {
    try {
      const supabase = getSupabaseClient()
      
      const { data: allQuestions, error: allError } = await supabase
        .from('alex_orchestration_questions')
        .select('*')
        .eq('conversation_id', params.conversationId)
        .eq('user_id', params.userId)
      
      if (allError) {
        console.error('[Orchestration Question Service] Failed to get stats:', allError)
        return { totalAsked: 0, answered: 0, unanswered: 0, recentUnanswered: 0 }
      }
      
      const totalAsked = allQuestions?.length || 0
      const answered = allQuestions?.filter(q => q.is_answered).length || 0
      const unanswered = allQuestions?.filter(q => !q.is_answered && q.relevance_status === 'active').length || 0
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const recentUnanswered = allQuestions?.filter(q => 
        !q.is_answered && 
        q.relevance_status === 'active' && 
        new Date(q.created_at) > new Date(fiveMinutesAgo)
      ).length || 0
      
      return { totalAsked, answered, unanswered, recentUnanswered }
    } catch (error) {
      console.error('[Orchestration Question Service] Error getting stats:', error)
      return { totalAsked: 0, answered: 0, unanswered: 0, recentUnanswered: 0 }
    }
  }
}