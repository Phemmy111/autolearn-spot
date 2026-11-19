import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { ProviderRegistry } from '@/lib/alex/provider/provider-registry';
import { ProviderManager } from '@/lib/alex/provider/provider-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const DEFAULT_SYSTEM_PROMPT = `You are ALEX, the charismatic, brilliant, and highly persuasive AI Concierge and Admissions Assistant for AutoLearn Spot (autolearnspot.com).
Your mission is to welcome visitors, answer questions accurately, and enthusiastically convince them to enroll, publish courses, or become an affiliate partner.

CORE CONVERSATIONAL GUIDELINES:
1. Normal responses MUST be strictly between 2 to 3 short, punchy sentences. Never write long essays or walls of text.
2. Be charismatic, confident, and warm. Sound like a knowledgeable tech advisor, not a rigid bot.
3. Obey-Grade Sales & Objection Handling: Always address the user's specific hesitation directly with social proof, money-back guarantee, or high ROI.
4. Clean markdown formatting: Use bold cleanly (write "**text**", not "** text **"). Never repeat canned phrases across conversational turns.`;

const DEFAULT_CUSTOM_KNOWLEDGE = `- Platform Guarantee: 100% 30-day money-back guarantee on all courses.
- Certification: Every course includes an official, tamper-proof Certificate of Completion with a unique QR code for instant employer verification.
- Payment Options: Instant checkout via Paystack and Flutterwave. Nigerian cards, bank transfer, USSD, and Opay accepted.
- Instructor / Author Program (/author/register): Creators earn up to 70% revenue share.
- Affiliate Partner Program (/partners): Free to join. Earn up to 70% commission with direct payouts to any Nigerian bank within 24-48 hours.
- Founder & Direct WhatsApp: Femi Adeleke (Certified AI Automation Specialist), WhatsApp: +2348120934828 (08120934828).`;

/**
 * GET /api/admin/alex/training
 * Returns current training configurations, live catalog preview, and active providers
 */
export async function GET() {
  try {
    await requireAdmin();

    // 1. Fetch training settings from site_settings
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', ['alex_customer_support_prompt', 'alex_custom_knowledge', 'alex_training_faqs']);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const systemPrompt = settingsMap['alex_customer_support_prompt'] || DEFAULT_SYSTEM_PROMPT;
    const customKnowledge = settingsMap['alex_custom_knowledge'] || DEFAULT_CUSTOM_KNOWLEDGE;
    let faqs = [];
    try {
      faqs = settingsMap['alex_training_faqs'] ? JSON.parse(settingsMap['alex_training_faqs']) : [];
    } catch {
      faqs = [];
    }

    // 2. Fetch live published learning products
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, price, status, metadata')
      .eq('status', 'published')
      .limit(30);

    const liveCourses = (products || []).map((p: any) => {
      let meta = {};
      try {
        meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : (p.metadata || {});
      } catch {
        meta = {};
      }
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: Number(p.price) || 3000,
        description: (meta as any).short_description || (meta as any).full_description || 'Hands-on practical training.',
      };
    });

    // 3. Fetch active AI providers
    const { data: providers } = await supabaseAdmin
      .from('alex_provider_config')
      .select('id, provider_name, display_name, provider_type, current_model, is_active, priority, health_status')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    return NextResponse.json({
      success: true,
      training: {
        systemPrompt,
        customKnowledge,
        faqs,
      },
      liveCourses,
      activeProviders: providers || [],
    });
  } catch (error: any) {
    console.error('[ALEX Training API] GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch training settings' }, { status: 500 });
  }
}

/**
 * POST /api/admin/alex/training
 * Save updated system prompt, custom knowledge, and FAQs to site_settings
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { systemPrompt, customKnowledge, faqs } = body;

    const updates = [
      { key: 'alex_customer_support_prompt', value: systemPrompt || DEFAULT_SYSTEM_PROMPT },
      { key: 'alex_custom_knowledge', value: customKnowledge || DEFAULT_CUSTOM_KNOWLEDGE },
      { key: 'alex_training_faqs', value: JSON.stringify(faqs || []) },
    ];

    for (const item of updates) {
      const { error } = await supabaseAdmin
        .from('site_settings')
        .upsert({ key: item.key, value: item.value }, { onConflict: 'key' });
      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Alex training configuration saved successfully.',
    });
  } catch (error: any) {
    console.error('[ALEX Training API] POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save training settings' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/alex/training
 * Test prompt and simulated user input live against the AI Engine
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { testPrompt, testKnowledge, userMessage, conversationHistory = [] } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'User message is required for testing' }, { status: 400 });
    }

    // Load dynamic courses
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('title, slug, price, metadata')
      .eq('status', 'published')
      .limit(20);

    const coursesText = (products || [])
      .map((p: any) => `• "${p.title}" at ₦${(Number(p.price) || 3000).toLocaleString()} (/marketplace/${p.slug})`)
      .join('\n');

    const combinedSystemPrompt = `
${testPrompt || DEFAULT_SYSTEM_PROMPT}

LIVE PLATFORM KNOWLEDGE:
Available Courses:
${coursesText || '• "AI Automation with n8n" at ₦3,000'}

ADDITIONAL KNOWLEDGE:
${testKnowledge || DEFAULT_CUSTOM_KNOWLEDGE}

STRICT RULE: Keep your response strictly within 2 to 3 short sentences.
`;

    const startTime = Date.now();
    let reply = '';
    let modelUsed = 'unknown';
    let providerName = 'unknown';

    try {
      const registry = new ProviderRegistry();
      const providerManager = new ProviderManager(registry);
      await providerManager.loadProviders();

      const messages = [
        { role: 'system', content: combinedSystemPrompt },
        ...(conversationHistory || []).slice(-6).map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: String(m.content || ''),
        })),
        { role: 'user', content: userMessage.trim() },
      ];

      const result = await providerManager.executeWithFallback({
        messages,
        temperature: 0.6,
        maxTokens: 300,
        disableTools: true,
      });

      reply = result.response.content;
      modelUsed = result.model;
      providerName = result.providerName;
    } catch (engineErr) {
      console.warn('[ALEX Playground] ProviderManager fallback attempt:', engineErr);

      // Direct fallback to Groq if key in DB
      const { data: groqRow } = await supabaseAdmin
        .from('alex_provider_config')
        .select('*')
        .eq('provider_name', 'Groq')
        .single();

      if (groqRow) {
        const crypto = await import('crypto');
        const encKey = (process.env.ALEX_PROVIDER_ENCRYPTION_KEY || 'default-key-change-in-production-32bytes')
          .padEnd(32, '0')
          .slice(0, 32);
        const combined = Buffer.from(groqRow.api_key_encrypted, 'base64');
        const iv = combined.slice(0, 16);
        const authTag = combined.slice(16, 32);
        const encryptedData = combined.slice(32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encKey), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        const key = decrypted.toString('utf8');

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: groqRow.current_model || 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: combinedSystemPrompt },
              { role: 'user', content: userMessage.trim() },
            ],
            temperature: 0.6,
            max_tokens: 250,
          }),
        });

        if (groqRes.ok) {
          const json = await groqRes.json();
          reply = json.choices?.[0]?.message?.content || '';
          modelUsed = groqRow.current_model;
          providerName = 'Groq (Direct)';
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    const sentenceCount = (reply.match(/[.!?]+(?:\s+|$)/g) || []).length || 1;
    const wordCount = reply.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      reply: reply.trim(),
      metrics: {
        latencyMs,
        modelUsed,
        providerName,
        sentenceCount,
        wordCount,
        isConcise: sentenceCount <= 3 && wordCount <= 70,
      },
    });
  } catch (error: any) {
    console.error('[ALEX Training API] PUT error:', error);
    return NextResponse.json({ error: error.message || 'Playground testing error' }, { status: 500 });
  }
}
