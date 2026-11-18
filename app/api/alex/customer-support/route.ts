import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ProviderRegistry } from '@/lib/alex/provider/provider-registry';
import { ProviderManager } from '@/lib/alex/provider/provider-manager';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

interface CourseSummary {
  title: string;
  price: number;
  slug: string;
  description: string;
}

// Dynamically compile the latest live platform knowledge from the database
async function getLivePlatformKnowledge(): Promise<{
  knowledgeText: string;
  courses: CourseSummary[];
}> {
  let courses: CourseSummary[] = [];
  try {
    const { data: lpData } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, price, status, metadata')
      .eq('status', 'published')
      .limit(20);

    if (lpData && lpData.length > 0) {
      courses = lpData.map((item: any) => {
        const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata || '{}') : (item.metadata || {});
        return {
          title: item.title,
          price: Number(item.price) || 3000,
          slug: item.slug || '',
          description: meta.short_description || meta.full_description || 'Hands-on practical training with verified certification.',
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

  const coursesList = courses
    .map((c) => `• "${c.title}" at ₦${c.price.toLocaleString()} (https://www.autolearnspot.com/marketplace/${c.slug || 'ai-automation-with-n8n'}) - ${c.description}`)
    .join('\n');

  const knowledgeText = `
You are ALEX, the friendly, brilliant, and persuasive AI Admissions Concierge and Assistant for AutoLearn Spot (autolearnspot.com).
Your mission is to welcome visitors, answer questions accurately, and enthusiastically convince them to learn, teach, or partner with AutoLearn Spot.

LIVE PLATFORM FACTS & KNOWLEDGE:
- Mission: Nigeria & Africa's #1 practical tech skills academy. Hands-on, project-based video training designed to help students earn high income.
- Live Available Courses & Pricing:
${coursesList}
- Flagship Course: "AI Automation with n8n" currently on a limited-time promo price of ₦3,000 (one-time payment, lifetime access, originally ₦30,000). Students learn to build Telegram bots, AI agents, CRM syncs, and viral pipelines.
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

STRICT CONVERSATIONAL CONSTRAINT:
1. Normal conversational responses MUST be strictly between 2 to 3 short sentences. Never write long essays or walls of text.
2. Be warm, persuasive, and directly answer what the user asked.
3. Clean formatting: Never output clumsy spaces inside bold asterisks (write "**word**", not "** word **").
`;

  return { knowledgeText, courses };
}

// Clean fallback adhering to the 2-3 sentence rule
function getSmartFallbackReply(userMessage: string, courses: CourseSummary[]): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('fee')) {
    const flagship = courses[0] || { title: 'AI Automation with n8n', price: 3000 };
    return `Our flagship course, ${flagship.title}, is currently available at a special promo price of ₦${flagship.price.toLocaleString()} for lifetime access. It includes 12 hands-on video lessons, a verified QR certificate, and our 30-day money-back guarantee. You can enroll instantly or message founder Femi Adeleke on WhatsApp at [08120934828](https://wa.me/2348120934828)!`;
  }

  if (lower.includes('certificate') || lower.includes('verified') || lower.includes('guarantee')) {
    return `Yes! Every course includes an official, tamper-proof Certificate of Completion with a unique QR code for instant employer verification. It is backed by our 100% 30-day money-back guarantee. You can showcase it proudly on LinkedIn and your resume!`;
  }

  if (lower.includes('author') || lower.includes('teach') || lower.includes('create course') || lower.includes('instructor')) {
    return `You can teach on AutoLearn Spot and earn up to 70% revenue share on every student enrollment! We provide full author tooling and marketing support to help your course succeed. Register as an author today at [/author/register](https://www.autolearnspot.com/author/register)!`;
  }

  if (lower.includes('affiliate') || lower.includes('partner') || lower.includes('commission') || lower.includes('earn')) {
    return `Our Affiliate Partner Program allows you to earn up to 70% commission on every course referral! Payouts are made directly to all Nigerian bank accounts within 24–48 hours with real-time tracking. Join for free right now at [/partners](https://www.autolearnspot.com/partners)!`;
  }

  if (lower.includes('founder') || lower.includes('femi') || lower.includes('human') || lower.includes('contact') || lower.includes('whatsapp') || lower.includes('phone')) {
    return `You can chat directly with our founder, Femi Adeleke, on WhatsApp at [08120934828](https://wa.me/2348120934828) for quick support in under 15 minutes. You can also call 08120934828 or email autolearnspot@gmail.com anytime. How else can I assist your learning journey today?`;
  }

  if (lower.includes('course') || lower.includes('n8n') || lower.includes('learn') || lower.includes('what do you teach')) {
    return `AutoLearn Spot offers practical tech courses, led by our popular AI Automation with n8n course for just ₦3,000 promo. You will build real-world AI agents, Telegram bots, and automated business workflows with lifetime access. Would you like me to guide you through enrollment?`;
  }

  return `Welcome to AutoLearn Spot! I can help you enroll in our ₦3,000 AI Automation course, explain our verified certificates, or show you how to earn up to 70% as an affiliate partner. What would you like to explore today?`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmed = message.trim();
    const { knowledgeText, courses } = await getLivePlatformKnowledge();

    // Attempt generation through registered AI providers (Groq / Gemini)
    try {
      const registry = new ProviderRegistry();
      const providerManager = new ProviderManager(registry);
      await providerManager.loadProviders();

      const activeProviders = registry.getEnabledProviders();

      if (activeProviders && activeProviders.length > 0) {
        const formattedHistory = (conversationHistory || []).slice(-6).map((item: any) => ({
          role: (item.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: String(item.content || ''),
        }));

        let aiReply = '';
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI Provider timeout')), 12000)
        );

        const streamPromise = (async () => {
          for await (const chunk of providerManager.executeStreamingWithFallback({
            messages: [
              { role: 'system', content: knowledgeText },
              ...formattedHistory,
              { role: 'user', content: trimmed },
            ],
            model: activeProviders[0]?.model,
            temperature: 0.6,
            maxTokens: 300,
            stream: true,
            disableTools: true,
          })) {
            if (chunk.type === 'delta' && chunk.data?.text) {
              aiReply += chunk.data.text;
            }
          }
          return aiReply;
        })();

        await Promise.race([streamPromise, timeoutPromise]);

        const cleanReply = aiReply.trim();
        if (cleanReply.length > 0) {
          return NextResponse.json({
            reply: cleanReply,
            source: 'alex_ai',
          });
        }
      }
    } catch (aiErr) {
      console.warn('[ALEX Concierge] AI provider call fallback:', aiErr);
    }

    // Dynamic smart fallback
    const fallbackReply = getSmartFallbackReply(trimmed, courses);
    return NextResponse.json({
      reply: fallbackReply,
      source: 'smart_concierge',
    });
  } catch (error) {
    console.error('[ALEX Customer Support] Route Error:', error);
    return NextResponse.json({
      reply: `AutoLearn Spot is Nigeria's top practical tech academy, featuring our ₦3,000 AI Automation with n8n promo and verified certificates. You can chat directly with founder Femi Adeleke on WhatsApp at [08120934828](https://wa.me/2348120934828) for instant support!`,
      source: 'fallback',
    });
  }
}
