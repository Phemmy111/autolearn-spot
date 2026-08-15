import { supabase } from '@/lib/supabase'
import { AlexProviderManager } from './alex-provider'
import { AlexMode } from './types'

export interface CostTrackingData {
  userId: string
  conversationId: string
  model: string
  tokensUsed: number
  mode: AlexMode
}

export interface CostLimits {
  maxTokens: number
  dailyRequestLimit: number
  monthlyRequestLimit: number
}

/**
 * ALEX Cost Tracker
 * Tracks ALEX-specific usage and enforces cost limits
 */
export class AlexCostTracker {
  /**
   * Track usage for a conversation
   */
  static async trackUsage(data: CostTrackingData): Promise<void> {
    try {
      // Get provider config for cost estimation
      const providerConfig = await AlexProviderManager.getProviderConfig()
      if (!providerConfig) {
        console.warn('No ALEX provider configured, skipping cost tracking')
        return
      }

      // Estimate cost (rough estimation based on typical pricing)
      const estimatedCost = this.estimateCost(data.tokensUsed, data.model)

      // Record usage
      await supabase.from('alex_usage').insert({
        user_id: data.userId,
        conversation_id: data.conversationId,
        model: data.model,
        tokens_used: data.tokensUsed,
        estimated_cost: estimatedCost,
        mode: data.mode,
      })
    } catch (error) {
      console.error('Error tracking ALEX usage:', error)
      // Don't throw - tracking failures shouldn't break the main flow
    }
  }

  /**
   * Check if user is within limits
   */
  static async checkLimits(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const providerConfig = await AlexProviderManager.getProviderConfig()
      if (!providerConfig) {
        return { allowed: true } // Allow if no provider configured
      }

      const costControls = providerConfig.costControls
      if (!costControls) {
        return { allowed: true }
      }

      // Check daily limit
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: dailyCount } = await supabase
        .from('alex_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())

      if (dailyCount && dailyCount >= costControls.dailyRequestLimit) {
        return { allowed: false, reason: 'Daily request limit exceeded' }
      }

      // Check monthly limit
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const { count: monthlyCount } = await supabase
        .from('alex_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', thisMonth.toISOString())

      if (monthlyCount && monthlyCount >= costControls.monthlyRequestLimit) {
        return { allowed: false, reason: 'Monthly request limit exceeded' }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking ALEX limits:', error)
      return { allowed: true } // Allow on error to avoid blocking
    }
  }

  /**
   * Get user usage statistics
   */
  static async getUserUsage(userId: string): Promise<{
    daily: number
    monthly: number
    total: number
    totalCost: number
  }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      // Daily usage
      const { count: dailyCount } = await supabase
        .from('alex_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())

      // Monthly usage
      const { count: monthlyCount } = await supabase
        .from('alex_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', thisMonth.toISOString())

      // Total usage and cost
      const { data: totalData } = await supabase
        .from('alex_usage')
        .select('tokens_used, estimated_cost')
        .eq('user_id', userId)

      const totalTokens = totalData?.reduce((sum, record) => sum + (record.tokens_used || 0), 0) || 0
      const totalCost = totalData?.reduce((sum, record) => sum + (record.estimated_cost || 0), 0) || 0

      return {
        daily: dailyCount || 0,
        monthly: monthlyCount || 0,
        total: totalData?.length || 0,
        totalCost,
      }
    } catch (error) {
      console.error('Error getting user usage:', error)
      return {
        daily: 0,
        monthly: 0,
        total: 0,
        totalCost: 0,
      }
    }
  }

  /**
   * Get admin usage analytics
   */
  static async getAdminAnalytics(): Promise<{
    totalConversations: number
    totalMessages: number
    totalTokens: number
    totalCost: number
    modeBreakdown: Record<string, number>
    modelBreakdown: Record<string, number>
  }> {
    try {
      // Total conversations
      const { count: totalConversations } = await supabase
        .from('alex_conversations')
        .select('*', { count: 'exact', head: true })

      // Total messages
      const { count: totalMessages } = await supabase
        .from('alex_messages')
        .select('*', { count: 'exact', head: true })

      // Usage data
      const { data: usageData } = await supabase
        .from('alex_usage')
        .select('tokens_used, estimated_cost, mode, model')

      const totalTokens = usageData?.reduce((sum, record) => sum + (record.tokens_used || 0), 0) || 0
      const totalCost = usageData?.reduce((sum, record) => sum + (record.estimated_cost || 0), 0) || 0

      // Mode breakdown
      const modeBreakdown: Record<string, number> = {}
      usageData?.forEach(record => {
        const mode = record.mode || 'unknown'
        modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1
      })

      // Model breakdown
      const modelBreakdown: Record<string, number> = {}
      usageData?.forEach(record => {
        const model = record.model || 'unknown'
        modelBreakdown[model] = (modelBreakdown[model] || 0) + 1
      })

      return {
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0,
        totalTokens,
        totalCost,
        modeBreakdown,
        modelBreakdown,
      }
    } catch (error) {
      console.error('Error getting admin analytics:', error)
      return {
        totalConversations: 0,
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        modeBreakdown: {},
        modelBreakdown: {},
      }
    }
  }

  /**
   * Estimate cost based on tokens and model
   * This is a rough estimation - actual costs depend on provider pricing
   */
  private static estimateCost(tokens: number, model: string): number {
    // Rough cost estimation (assuming ~$0.001 per 1K tokens as baseline)
    const costPer1KTokens = 0.001
    return (tokens / 1000) * costPer1KTokens
  }
}