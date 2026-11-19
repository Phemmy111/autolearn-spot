import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ProviderRegistry } from '@/lib/alex/provider/provider-registry';
import { ProviderManager } from '@/lib/alex/provider/provider-manager';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

interface CourseSummary {
  title: string;
  price: number;
  slug: string;
  description: string;
}

// Decrypt helper for direct provider failover
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

// Dynamically compile the latest live platform knowledge and admin training rules
async function getLivePlatformKnowledge(): Promise<{
  knowledgeText: string;
  courses: CourseSummary[];
}> {
  let courses: CourseSummary[] = [];

  // 1. Fetch live courses from database
  try {
    const { data: lpData } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, price, status, metadata')
      .eq('status', 'published')
      .limit(25);

    if (lpData && lpData.length > 0) {
      courses = lpData.map((item: any) => {
        let meta: any = {};
        try {
          meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata || '{}') : (item.metadata || {});
        } catch {
          meta = {};
        }
        return {
          title: item.title,
          price: Number(item.price) || 3000,
          slug: item.slug || 'ai-automation-with-n8n',
          description: meta.short_description || meta.full_description || 'Hands-on practical tech training with verified certification.',
        };
      });
    }
  } catch (err) {
    console.warn('[ALEX Concierge] Could not load dynamic learning products:', err);
  }

  if (courses.length === 0) {
    courses = [
      {
        title: 'AI Automation with n8n',
        price: 3000,
        slug: 'ai-automation-with-n8n',
        description: 'Hands-on AI workflow automation, bots, and integrations. ₦3,000 promo.',
      },
    ];
  }

  // 2. Fetch custom training prompt and knowledge from site_settings (configured via Admin Training Hub)
  let customPrompt = '';
  let customKnowledge = '';
  try {
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', ['alex_customer_support_prompt', 'alex_custom_knowledge']);

    (settings || []).forEach((s) => {
      if (s.key === 'alex_customer_support_prompt') customPrompt = s.value;
      if (s.key === 'alex_custom_knowledge') customKnowledge = s.value;
    });
  } catch (err) {
    console.warn('[ALEX Concierge] Could not load custom site_settings:', err);
  }

  const coursesList = courses
    .map((c) => `• "${c.title}" at ₦${c.price.toLocaleString()} (https://www.autolearnspot.com/marketplace/${c.slug}) - ${c.description}`)
    .join('\n');

  const baseInstructions = customPrompt || `You are ALEX, the charismatic, brilliant, and persuasive AI Admissions Concierge and Advisor for AutoLearn Spot (autolearnspot.com).
Your mission is to welcome visitors, answer questions dynamically and accurately, and enthusiastically convince them to enroll, publish courses, or become an affiliate partner.`;

  const knowledgeText = `
${baseInstructions}

LIVE PLATFORM FACTS & KNOWLEDGE:
- Mission: Nigeria & Africa's #1 practical tech skills academy. Hands-on, project-based video training designed to help students build real systems and earn high income.
- Live Available Courses & Pricing:
${coursesList}
- Flagship Course: "AI Automation with n8n" currently on a limited-time promo price of ₦3,000 (one-time payment, lifetime access, originally ₦30,000). Students learn to build autonomous AI agents, Telegram bots, CRM syncs, and viral pipelines without writing complex code.
- Guaranteed Verified Certificate:
  • Every student who finishes their lessons receives an official, tamper-proof Certificate of Completion with unique verification ID and instant QR code verification (/certificate/verify).
- 30-Day Money-Back Guarantee:
  • 100% risk-free. If a student is not satisfied within 30 days, they receive a full refund with no hassle.
- Payment Options:
  • Instant, secure checkout via Paystack & Flutterwave.
  • Accepts Nigerian Debit Cards (Mastercard, Visa, Verve), Direct Bank Transfer, USSD, and Opay.
- Become an Author / Instructor (/author/register):
  • Tech professionals, developers, and educators can publish courses on AutoLearn Spot, access course creation tools, and earn up to 70% revenue share.
- Become an Affiliate Partner (/partners):
  • Free to join. Affiliates earn up to 70% commission per referral.
  • Automated, fast 24–48 hour direct payouts to all Nigerian bank accounts (GTBank, Access, Kuda, Opay, PalmPay, etc.). Real-time conversion tracking.
- Founder & Direct Human Support:
  • Founder & Lead Instructor: Femi Adeleke (Certified AI Automation Specialist).
  • WhatsApp: https://wa.me/2348120934828 (08120934828). Fast response under 15 minutes!
  • Email: autolearnspot@gmail.com and support@autolearnspot.com.

ADDITIONAL KNOWLEDGE:
${customKnowledge || '- Obey-Grade Conversational Intelligence: Address the user directly, answer what they specifically asked, and eliminate doubts.'}

STRICT CONVERSATIONAL CONSTRAINTS:
1. Normal conversational responses MUST be strictly between 2 to 3 short sentences. Never write long essays or walls of text.
2. Be warm, charismatic, and directly address what the user actually said.
3. Clean formatting: Never output clumsy spaces inside bold asterisks (write "**word**", not "** word **").
4. Never repeat identical canned phrases from turn to turn. Every response must be 100% dynamic and context-aware.
`;

  return { knowledgeText, courses };
}

// Emergency conversational response generator if all AI providers fail
function getDynamicEmergencyReply(userMessage: string, courses: CourseSummary[]): string {
  const lower = userMessage.toLowerCase().trim();

  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('fee')) {
    const flagship = courses[0] || { title: 'AI Automation with n8n', price: 3000, slug: 'ai-automation-with-n8n' };
    return `Our flagship course, **${flagship.title}**, is currently on a special promo for just ₦${flagship.price.toLocaleString()} for lifetime access. It includes practical video modules, a verifiable QR certificate, and a 30-day money-back guarantee. You can start learning immediately or message founder Femi Adeleke on WhatsApp at [08120934828](https://wa.me/2348120934828)!`;
  }

  if (lower.includes('certificate') || lower.includes('verified') || lower.includes('guarantee')) {
    return `Yes, every completed course includes an official, tamper-proof Certificate of Completion with a unique verification ID and QR code. It is backed by our 100% 30-day money-back guarantee and is easy to display on LinkedIn. Would you like me to show you how to enroll today?`;
  }

  if (lower.includes('author') || lower.includes('teach') || lower.includes('create course') || lower.includes('instructor')) {
    return `You can teach on AutoLearn Spot and earn up to 70% revenue share on every single enrollment! We provide full creator tooling and marketing support to help your course scale. You can register right away at [/author/register](https://www.autolearnspot.com/author/register).`;
  }

  if (lower.includes('affiliate') || lower.includes('partner') || lower.includes('commission') || lower.includes('earn')) {
    return `Our Affiliate Partner Program is free to join and pays up to 70% commission on every course referral! Earnings are sent directly to all Nigerian bank accounts within 24 to 48 hours. Sign up in under two minutes at [/partners](https://www.autolearnspot.com/partners)!`;
  }

  if (lower.includes('founder') || lower.includes('femi') || lower.includes('whatsapp') || lower.includes('phone') || lower.includes('human')) {
    return `You can chat directly with our founder, Femi Adeleke, on WhatsApp at [08120934828](https://wa.me/2348120934828) for answers in under 15 minutes. He will gladly answer your questions about courses, certifications, and career growth. What skill are you most excited to learn?`;
  }

  // Dynamic context acknowledgment
  const sampleCourse = courses[0] || { title: 'AI Automation with n8n', price: 3000 };
  return `Great to chat with you! At AutoLearn Spot, you can master high-income skills starting with our flagship **${sampleCourse.title}** course for just ₦${sampleCourse.price.toLocaleString()} promo. Would you like to explore our course catalog, learn about our verified certificates, or chat with founder Femi Adeleke?`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [], conversationId: clientConvId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmed = message.trim();
    const { knowledgeText, courses } = await getLivePlatformKnowledge();

    // 1. Maintain or create conversation in database for audit & admin monitoring
    let convId = clientConvId;
    try {
      if (convId) {
        // verify conversation exists
        const { data: existing } = await supabaseAdmin
          .from('alex_conversations')
          .select('id')
          .eq('id', convId)
          .maybeSingle();

        if (!existing) convId = null;
      }

      if (!convId) {
        const titleSnippet = trimmed.length > 40 ? trimmed.substring(0, 37) + '...' : trimmed;
        const { data: newConv } = await supabaseAdmin
          .from('alex_conversations')
          .insert({
            title: titleSnippet || 'Visitor Inquiry',
            mode: 'customer_service',
            user_id: `visitor_${Date.now().toString(36)}`,
          })
          .select('id')
          .single();

        if (newConv) convId = newConv.id;
      }

      // Log user message
      if (convId) {
        await supabaseAdmin.from('alex_messages').insert({
          conversation_id: convId,
          role: 'user',
          content: trimmed,
          tokens: 0,
        });
      }
    } catch (dbErr) {
      console.warn('[ALEX Concierge] Non-blocking conversation logging issue:', dbErr);
    }

    // 2. Format conversation history for multi-turn AI context
    const formattedHistory = (conversationHistory || []).slice(-8).map((item: any) => ({
      role: (item.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: String(item.content || ''),
    }));

    const aiMessages = [
      { role: 'system' as const, content: knowledgeText },
      ...formattedHistory,
      { role: 'user' as const, content: trimmed },
    ];

    let generatedReply = '';
    let modelUsed = 'unknown';

    // 3. ATTEMPT 1: Primary generation via ProviderManager with automatic failover
    try {
      const registry = new ProviderRegistry();
      const providerManager = new ProviderManager(registry);
      await providerManager.loadProviders();

      const activeProviders = registry.getEnabledProviders();

      if (activeProviders && activeProviders.length > 0) {
        const result = await providerManager.executeWithFallback({
          messages: aiMessages,
          temperature: 0.6,
          maxTokens: 280,
          disableTools: true,
        });

        if (result && result.response?.content) {
          generatedReply = result.response.content.trim();
          modelUsed = result.model || 'alex-provider';
        }
      }
    } catch (pmErr) {
      console.warn('[ALEX Concierge] ProviderManager attempt failed, falling back to direct provider:', pmErr);
    }

    // 4. ATTEMPT 2: Direct failover to Groq with decrypted key from alex_provider_config
    if (!generatedReply) {
      try {
        const { data: groqRow } = await supabaseAdmin
          .from('alex_provider_config')
          .select('*')
          .eq('provider_name', 'Groq')
          .single();

        if (groqRow) {
          const key = decryptKey(groqRow.api_key_encrypted) || process.env.GROQ_API_KEY;
          if (key) {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: groqRow.current_model || 'openai/gpt-oss-120b',
                messages: aiMessages,
                temperature: 0.6,
                max_tokens: 280,
              }),
            });

            if (groqRes.ok) {
              const groqJson = await groqRes.json();
              generatedReply = groqJson.choices?.[0]?.message?.content?.trim() || '';
              modelUsed = groqRow.current_model || 'groq';
            }
          }
        }
      } catch (directGroqErr) {
        console.warn('[ALEX Concierge] Direct Groq attempt failed:', directGroqErr);
      }
    }

    // 5. ATTEMPT 3: Direct failover to Google Gemini if configured
    if (!generatedReply && process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `${knowledgeText}\n\nUser Question: ${trimmed}\nKeep answer strictly to 2-3 short sentences:`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 250,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          const cand = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (cand) {
            generatedReply = cand.trim();
            modelUsed = 'gemini-2.0-flash';
          }
        }
      } catch (geminiErr) {
        console.warn('[ALEX Concierge] Gemini fallback failed:', geminiErr);
      }
    }

    // 6. Final safety fallback
    if (!generatedReply) {
      generatedReply = getDynamicEmergencyReply(trimmed, courses);
      modelUsed = 'smart_emergency_fallback';
    }

    // Log assistant message in database
    if (convId && generatedReply) {
      try {
        await supabaseAdmin.from('alex_messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: generatedReply,
          model_used: modelUsed,
          tokens: Math.ceil(generatedReply.length / 4),
        });

        await supabaseAdmin
          .from('alex_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);
      } catch (dbSaveErr) {
        console.warn('[ALEX Concierge] Message save issue:', dbSaveErr);
      }
    }

    return NextResponse.json({
      reply: generatedReply,
      conversationId: convId,
      modelUsed,
      source: modelUsed === 'smart_emergency_fallback' ? 'smart_concierge' : 'alex_ai',
    });
  } catch (error) {
    console.error('[ALEX Customer Support] Route Error:', error);
    return NextResponse.json({
      reply: `AutoLearn Spot provides hands-on practical tech courses including our ₦3,000 AI Automation with n8n promo and verified certificates. You can message founder Femi Adeleke on WhatsApp at [08120934828](https://wa.me/2348120934828) for instant enrollment help!`,
      source: 'fallback',
    });
  }
}
