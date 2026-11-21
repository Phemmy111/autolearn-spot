import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AIEngine } from '@/lib/alex/ai-engine';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for AI generation

// Decrypt key from alex_provider_config
function decryptKey(encrypted: string): string {
  try {
    const encKey = (process.env.ALEX_PROVIDER_ENCRYPTION_KEY || 'default-key-change-in-production-32bytes')
      .padEnd(32, '0')
      .slice(0, 32);
    const combined = Buffer.from(encrypted, 'base64');
    if (combined.length < 32) return '';
    const iv = combined.slice(0, 16);
    const authTag = combined.slice(16, 32);
    const encryptedData = combined.slice(32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encKey), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { script, lessonId, questionCount } = await request.json();

    if (!script) {
      return NextResponse.json({ error: 'Lesson script or summary is required' }, { status: 400 });
    }

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Verify lesson ownership
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('product_id, title')
      .eq('uuid_id', lessonId)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Get internal author_id from clerk userId
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 });
    }

    // Verify product ownership
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id')
      .eq('id', lesson.product_id)
      .maybeSingle();

    if (!product || product.author_id !== author.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 1. Get the global quiz generation prompt with robust default fallback
    const defaultPrompt = `You are an expert curriculum and educational assessment designer.
Generate a comprehensive, high-quality multiple choice quiz based strictly on the provided lesson script.
Return ONLY valid JSON matching this exact format:
{
  "title": "Lesson Quiz",
  "description": "Assessment of key concepts from this lesson",
  "questions": [
    {
      "question": "Clear, specific question text based directly on the lesson content?",
      "question_type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Brief explanation of why this answer is correct",
      "points": 10
    }
  ]
}`;

    let promptContent = defaultPrompt;
    try {
      const { data: activePrompt } = await supabaseAdmin
        .from('ai_prompts')
        .select('content')
        .is('author_id', null)
        .eq('prompt_type', 'quiz_generation')
        .eq('is_active', true)
        .maybeSingle();

      if (activePrompt?.content) {
        promptContent = activePrompt.content;
      }
    } catch (e) {
      console.warn('Could not load ai_prompts from DB, using default prompt');
    }

    const countText = questionCount ? `Generate exactly ${questionCount} questions.` : 'Generate 10 questions.';
    const prompt = `${promptContent}\n\nGenerate a quiz for lesson "${lesson.title}" based on this lesson script:\n\n${script}\n\n${countText}`;
    
    let fullContent = '';
    let usedProviderName = '';

    // 2. ATTEMPT 1: Automatically use active ALEX Providers from database (alex_provider_config)
    try {
      const { data: alexProviders } = await supabaseAdmin
        .from('alex_provider_config')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (alexProviders && alexProviders.length > 0) {
        for (const prov of alexProviders) {
          if (fullContent) break;

          const apiKey = decryptKey(prov.api_key_encrypted);
          if (!apiKey) continue;

          // Google Gemini Provider
          if (prov.provider_type === 'gemini') {
            try {
              const model = prov.current_model || 'gemini-flash-lite-latest';
              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                      temperature: 0.7,
                      maxOutputTokens: 4000,
                      responseMimeType: 'application/json',
                    },
                  }),
                }
              );

              if (geminiRes.ok) {
                const json = await geminiRes.json();
                fullContent = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (fullContent) {
                  usedProviderName = prov.provider_name || 'Gemini (ALEX)';
                  break;
                }
              }
            } catch (err) {
              console.warn('[ALEX Quiz] Gemini attempt error:', err);
            }
          }

          // Groq Provider
          if (prov.provider_type === 'groq') {
            try {
              const model = prov.current_model || 'openai/gpt-oss-120b';
              const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model,
                  messages: [{ role: 'user', content: prompt }],
                  temperature: 0.7,
                  max_tokens: 4000,
                  response_format: { type: 'json_object' },
                }),
              });

              if (groqRes.ok) {
                const json = await groqRes.json();
                fullContent = json.choices?.[0]?.message?.content || '';
                if (fullContent) {
                  usedProviderName = prov.provider_name || 'Groq (ALEX)';
                  break;
                }
              }
            } catch (err) {
              console.warn('[ALEX Quiz] Groq attempt error:', err);
            }
          }

          // OpenAI / Compatible Provider
          if (prov.provider_type === 'openai' || prov.provider_type === 'openai_compatible') {
            try {
              const baseUrl = prov.base_url || 'https://api.openai.com/v1';
              const model = prov.current_model || 'gpt-4o-mini';
              const oaiRes = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model,
                  messages: [{ role: 'user', content: prompt }],
                  temperature: 0.7,
                  max_tokens: 4000,
                  response_format: { type: 'json_object' },
                }),
              });

              if (oaiRes.ok) {
                const json = await oaiRes.json();
                fullContent = json.choices?.[0]?.message?.content || '';
                if (fullContent) {
                  usedProviderName = prov.provider_name || 'OpenAI (ALEX)';
                  break;
                }
              }
            } catch (err) {
              console.warn('[ALEX Quiz] OpenAI attempt error:', err);
            }
          }
        }
      }
    } catch (dbProvErr) {
      console.warn('[ALEX Quiz] Failed to query alex_provider_config:', dbProvErr);
    }

    // 3. ATTEMPT 2: Fallback to Environment Variables (if alex_provider_config did not produce content)
    if (!fullContent && process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4000,
                responseMimeType: 'application/json',
              },
            }),
          }
        );
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          fullContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (fullContent) usedProviderName = 'Gemini (Environment)';
        }
      } catch (geminiErr) {
        console.warn('Gemini env error:', geminiErr);
      }
    }

    if (!fullContent && process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
          }),
        });
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          fullContent = groqData.choices?.[0]?.message?.content || '';
          if (fullContent) usedProviderName = 'Groq (Environment)';
        }
      } catch (groqErr) {
        console.warn('Groq env error:', groqErr);
      }
    }

    // 4. ATTEMPT 3: Fallback to ProviderManager
    if (!fullContent) {
      try {
        const providerManager = AIEngine.getProviderManager();
        for await (const chunk of providerManager.executeStreamingWithFallback({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          maxTokens: 4000,
          stream: true,
          disableTools: true,
        })) {
          if (chunk.type === 'delta') {
            fullContent += chunk.data?.content || chunk.data?.text || '';
          }
        }
        if (fullContent) usedProviderName = 'ProviderManager';
      } catch (pmErr) {
        console.warn('ProviderManager error:', pmErr);
      }
    }

    if (!fullContent) {
      return NextResponse.json(
        {
          error:
            'Could not connect to an active AI provider. Please verify your ALEX providers in the Admin panel or ensure an active key is present.',
        },
        { status: 400 }
      );
    }

    // 5. Parse the JSON response
    let quizData: any;
    try {
      let cleanedContent = fullContent
        .replace(/```json\s*\n?/gi, '')
        .replace(/```\s*\n?/gi, '')
        .trim();
      
      cleanedContent = cleanedContent.replace(/[\x00-\x1F\x7F]/g, '');
      
      const firstBrace = cleanedContent.indexOf('{');
      const firstBracket = cleanedContent.indexOf('[');
      const startIdx = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;

      if (startIdx !== -1) {
        const isObject = cleanedContent[startIdx] === '{';
        let depth = 0;
        let endIdx = -1;
        const openChar = isObject ? '{' : '[';
        const closeChar = isObject ? '}' : ']';

        for (let i = startIdx; i < cleanedContent.length; i++) {
          if (cleanedContent[i] === openChar) depth++;
          if (cleanedContent[i] === closeChar) depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
        if (endIdx !== -1) {
          cleanedContent = cleanedContent.substring(startIdx, endIdx);
        }
      }
      
      quizData = JSON.parse(cleanedContent);
      if (Array.isArray(quizData)) {
        quizData = quizData[0] || {};
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', fullContent);
      return NextResponse.json({ error: 'AI output could not be parsed into quiz format. Please try again with a shorter script.' }, { status: 500 });
    }

    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      return NextResponse.json({ error: 'Invalid quiz format generated by AI. Please try again.' }, { status: 500 });
    }

    if (!quizData.title) {
      quizData.title = `${lesson.title} Quiz`;
    }

    // Transform AI response to match expected schema
    const transformedQuestions = quizData.questions.map((q: any) => ({
      question_text: q.question || q.question_text || 'Question',
      question_type: q.question_type || 'multiple_choice',
      options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: q.correct_answer || q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'Option A'),
      explanation: q.explanation || '',
      points: Number(q.points) || 10,
    }));

    quizData.questions = transformedQuestions;
    quizData.lesson_id = lessonId;
    quizData.description = quizData.description || `Quiz for lesson: ${lesson.title}`;

    // Save the quiz to the database
    const { data: savedQuiz, error: saveError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title: quizData.title,
        description: quizData.description,
        lesson_id: lessonId,
        time_limit: null,
        passing_score: 70,
        is_active: true
      })
      .select()
      .single();

    if (saveError) {
      console.error('[Generate Quiz] Failed to save quiz:', saveError);
      return NextResponse.json({ error: 'Failed to save quiz to database' }, { status: 500 });
    }

    // Save the questions
    const questionsToInsert = quizData.questions.map((q: any, index: number) => ({
      quiz_id: savedQuiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: q.points,
      order_index: index,
    }));

    const { error: questionsError } = await supabaseAdmin
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('[Generate Quiz] Failed to save questions:', questionsError);
      await supabaseAdmin.from('quizzes').delete().eq('id', savedQuiz.id);
      return NextResponse.json({ error: 'Failed to save quiz questions' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      providerUsed: usedProviderName,
      quiz: { ...quizData, id: savedQuiz.id } 
    });
  } catch (error: any) {
    console.error('[Generate Quiz] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate quiz' }, { status: 500 });
  }
}
