import { supabaseAdmin } from '@/lib/supabase'

export interface AIPrompt {
  id: string
  name: string
  prompt_type: string
  content: string
  version: number
  is_active: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export class AIPromptManager {
  /**
   * Get the active prompt for a specific type
   */
  static async getActivePrompt(promptType: string): Promise<AIPrompt | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('prompt_type', promptType)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching active prompt:', error)
        return null
      }

      return data as AIPrompt
    } catch (error) {
      console.error('Error fetching active prompt:', error)
      return null
    }
  }

  /**
   * Get all prompts for a specific type
   */
  static async getPromptsByType(promptType: string): Promise<AIPrompt[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('prompt_type', promptType)
        .order('version', { ascending: false })

      if (error) {
        console.error('Error fetching prompts:', error)
        return []
      }

      return data as AIPrompt[]
    } catch (error) {
      console.error('Error fetching prompts:', error)
      return []
    }
  }

  /**
   * Get all prompts
   */
  static async getAllPrompts(): Promise<AIPrompt[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .order('prompt_type', { ascending: true })
        .order('version', { ascending: false })

      if (error) {
        console.error('Error fetching all prompts:', error)
        return []
      }

      return data as AIPrompt[]
    } catch (error) {
      console.error('Error fetching all prompts:', error)
      return []
    }
  }

  /**
   * Create a new prompt
   */
  static async createPrompt(
    name: string,
    promptType: string,
    content: string,
    createdBy: string
  ): Promise<AIPrompt | null> {
    try {
      // Get the highest version for this prompt type
      const { data: existingPrompts } = await supabaseAdmin
        .from('ai_prompts')
        .select('version')
        .eq('prompt_type', promptType)
        .order('version', { ascending: false })
        .limit(1)

      const nextVersion = (existingPrompts?.[0]?.version || 0) + 1

      const { data, error } = await supabaseAdmin
        .from('ai_prompts')
        .insert({
          name,
          prompt_type: promptType,
          content,
          version: nextVersion,
          is_active: false,
          created_by: createdBy,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating prompt:', error)
        return null
      }

      return data as AIPrompt
    } catch (error) {
      console.error('Error creating prompt:', error)
      return null
    }
  }

  /**
   * Update a prompt
   */
  static async updatePrompt(
    id: string,
    updates: {
      name?: string
      content?: string
      is_active?: boolean
    },
    updatedBy: string
  ): Promise<AIPrompt | null> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      }

      if (updates.name) updateData.name = updates.name
      if (updates.content) updateData.content = updates.content
      if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active
        
        // If setting as active, deactivate other prompts of the same type
        if (updates.is_active) {
          const prompt = await this.getPromptById(id)
          if (prompt) {
            await supabaseAdmin
              .from('ai_prompts')
              .update({ is_active: false })
              .eq('prompt_type', prompt.prompt_type)
              .neq('id', id)
          }
        }
      }

      const { data, error } = await supabaseAdmin
        .from('ai_prompts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating prompt:', error)
        return null
      }

      return data as AIPrompt
    } catch (error) {
      console.error('Error updating prompt:', error)
      return null
    }
  }

  /**
   * Delete a prompt
   */
  static async deletePrompt(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('ai_prompts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting prompt:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting prompt:', error)
      return false
    }
  }

  /**
   * Set a prompt as active
   */
  static async setActivePrompt(id: string, updatedBy: string): Promise<boolean> {
    try {
      const prompt = await this.getPromptById(id)
      if (!prompt) {
        return false
      }

      // Deactivate all prompts of the same type
      await supabaseAdmin
        .from('ai_prompts')
        .update({ is_active: false })
        .eq('prompt_type', prompt.prompt_type)

      // Activate the selected prompt
      const { error } = await supabaseAdmin
        .from('ai_prompts')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        })
        .eq('id', id)

      if (error) {
        console.error('Error setting active prompt:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error setting active prompt:', error)
      return false
    }
  }

  /**
   * Get a specific prompt by ID
   */
  static async getPromptById(id: string): Promise<AIPrompt | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching prompt:', error)
        return null
      }

      return data as AIPrompt
    } catch (error) {
      console.error('Error fetching prompt:', error)
      return null
    }
  }

  /**
   * Seed initial quiz generation prompt
   */
  static async seedInitialPrompts(): Promise<void> {
    try {
      // Check if quiz generation prompt already exists
      const existing = await this.getActivePrompt('quiz_generation')
      if (existing) {
        return
      }

      const quizGenerationPrompt = `You are an expert quiz creator for an n8n and AI automation training course. 

Your task is to generate a comprehensive quiz based on the provided lesson script.

Requirements:
1. Create 5-8 questions that test understanding of the key concepts
2. Mix question types: multiple choice (3-4 options), true/false, and short answer
3. Questions should be challenging but fair
4. Include clear explanations for correct answers
5. Assign appropriate point values (1-3 points based on difficulty)

Output format (strict JSON):
{
  "title": "Quiz Title",
  "description": "Brief description of what this quiz covers",
  "questions": [
    {
      "question_text": "Question text here",
      "question_type": "multiple_choice|true_false|short_answer",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct answer text",
      "explanation": "Explanation of why this is correct",
      "points": 1
    }
  ]
}

Important:
- Return ONLY valid JSON, no markdown formatting
- Ensure all required fields are present
- Options array is required for multiple choice questions
- Correct answer must match one of the options for multiple choice
- For true/false, correct_answer should be "True" or "False"
- For short answer, provide the exact expected answer`

      await this.createPrompt(
        'Default Quiz Generation Prompt',
        'quiz_generation',
        quizGenerationPrompt,
        'system'
      )

      // Set it as active
      const prompts = await this.getPromptsByType('quiz_generation')
      if (prompts.length > 0) {
        await this.setActivePrompt(prompts[0].id, 'system')
      }
    } catch (error) {
      console.error('Error seeding initial prompts:', error)
    }
  }
}
