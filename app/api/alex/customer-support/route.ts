import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { AIEngine } from '@/lib/alex/ai-engine';
import { AlexMode } from '@/lib/alex/types';

export const dynamic = 'force-dynamic';

const PLATFORM_KNOWLEDGE = `
You are ALEX, the friendly, highly intelligent, and authoritative AI Customer Support Concierge and Admissions Advisor for AutoLearn Spot (autolearnspot.com).

AutoLearn Spot Overview:
- Mission: Nigeria and Africa's premier practical digital & tech skills academy. We equip individuals and professionals with real-world skills in AI automation, software engineering, and modern digital tools to earn high income.
- Flagship Course: "AI Automation with n8n"
  • Current Promo Price: ₦3,000 (one-time payment, lifetime access, originally ₦30,000).
  • Curriculum: 12 hands-on video lessons, AI agents, Telegram bots, webhook integrations, CRM sync, viral content automations, error handling.
  • Self-paced learning with lifetime access on all devices (mobile, laptop, tablet).
- Guaranteed Verified Certificate:
  • Every student who completes the course receives a verifiable digital Certificate of Completion.
  • Features student's full name, unique verification hash, and instant QR code verification.
- Risk-Free Guarantee:
  • 30-Day Money-Back Guarantee. If students aren't satisfied, full refund with no hassles.
- Payment Methods:
  • Paystack & Flutterwave secure checkout.
  • Supports Nigerian Debit Cards (Mastercard, Visa, Verve), Direct Bank Transfer, USSD, and Opay.
- Affiliate / Partner Program (/partners):
  • Anyone can join as an affiliate partner for free.
  • Authors set custom course commission rates up to 70% per sale (e.g. ₦600 to ₦2,100+ per sale on ₦3,000+ courses).
  • Fast 24–48 hour direct payouts to all Nigerian banks (GTBank, Access, Kuda, Opay, PalmPay, etc.).
  • Comprehensive dashboard with real-time conversion and link tracking.
- Contact & Human Support Channels:
  • Founder & Lead Instructor: Femi Adeleke (Certified AI & Workflow Automation Engineer).
  • WhatsApp Support (Fastest, < 15 mins response): https://wa.me/2348120934828 (08120934828 / +234 812 093 4828).
  • Official Email: autolearnspot@gmail.com and support@autolearnspot.com.
  • Direct Telephone: 08120934828.

Response Guidelines:
- Be welcoming, professional, concise, and helpful.
- When answering pricing, certificates, or courses, provide specific facts (₦3,000 promo price, QR certificate, 30-day guarantee).
- For complex inquiries, author applications, bulk corporate training, or if the user requests human assistance, provide founder Femi Adeleke's direct WhatsApp link (https://wa.me/2348120934828) and phone number (08120934828).
- Keep answers formatted with clean markdown, bullet points, and high readability.
`;

// Fallback intelligent answers if AI engine is temporarily unreachable
function getSmartFallbackReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('fee')) {
    return `Our flagship practical course, **AI Automation with n8n**, is currently available at a special promotional price of **₦3,000** (one-time payment, lifetime access, originally ₦30,000).\n\n• Includes 12 hands-on video lessons\n• Verifiable Certificate of Completion with QR code\n• 30-Day Money-Back Guarantee\n• Instant access upon payment via Card, Transfer, or USSD\n\nYou can enroll directly or reach our founder **Femi Adeleke** on WhatsApp at [08120934828](https://wa.me/2348120934828).`;
  }

  if (lower.includes('certificate') || lower.includes('guarantee') || lower.includes('verified')) {
    return `Yes, absolutely! Every course on AutoLearn Spot comes with a **Guaranteed Verified Certificate of Completion**.\n\n• Issued in your official name upon course completion\n• Features an tamper-proof cryptographic verification hash and scannable QR code\n• Ready for your LinkedIn profile, CV, and client portfolios\n• Backed by our **30-Day 100% Money-Back Guarantee**!`;
  }

  if (lower.includes('affiliate') || lower.includes('partner') || lower.includes('commission') || lower.includes('earn')) {
    return `You can earn significant income with the **AutoLearn Spot Affiliate Program**!\n\n• Earn custom commissions set by authors—**up to 70% per course sale**\n• Direct 24–48h payouts to all Nigerian bank accounts (GTBank, Access, Kuda, Opay, etc.)\n• Real-time tracking dashboard and unique course referral links\n• 100% free to join at [/partners](https://www.autolearnspot.com/partners)\n\nHave questions about becoming a partner? Chat with us directly on WhatsApp at [08120934828](https://wa.me/2348120934828).`;
  }

  if (lower.includes('contact') || lower.includes('phone') || lower.includes('whatsapp') || lower.includes('human') || lower.includes('call') || lower.includes('email') || lower.includes('founder') || lower.includes('femi')) {
    return `Here are our official contact details:\n\n• **Founder & Lead Instructor:** Femi Adeleke\n• **WhatsApp Direct Chat:** [Chat on WhatsApp](https://wa.me/2348120934828) (08120934828)\n• **Phone:** 08120934828 (+234 812 093 4828)\n• **Email:** [autolearnspot@gmail.com](mailto:autolearnspot@gmail.com)\n\nOur team is online and responds in under 15 minutes on WhatsApp!`;
  }

  if (lower.includes('course') || lower.includes('n8n') || lower.includes('learn') || lower.includes('syllabus')) {
    return `AutoLearn Spot provides hands-on, project-based tech courses designed for career growth:\n\n1. **AI Automation with n8n (Flagship):** Build autonomous AI agents, Telegram bots, CRM syncs, and viral content pipelines without complex code. Price: **₦3,000**.\n2. **Verified Certification:** Issued upon course completion.\n3. **Lifetime Access:** Watch on phone or computer anytime.\n\nWould you like guidance on enrolling, or do you have specific questions for founder **Femi Adeleke**? You can also message him directly on WhatsApp at [08120934828](https://wa.me/2348120934828).`;
  }

  return `Hello! I'm **ALEX**, your AutoLearn Spot AI Concierge.\n\nI can help you with:\n• **Course Catalog & ₦3,000 Promo:** AI Automation with n8n\n• **Guaranteed Certificates:** Digital verified credentials with QR validation\n• **Affiliate Partner Program:** Earn up to 70% commission per referral\n• **Direct Human Support:** Connect with founder Femi Adeleke on WhatsApp at [08120934828](https://wa.me/2348120934828)\n\nHow can I help you today? Feel free to ask any question or leave your inquiry!`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmed = message.trim();

    // Check if AI engine can process the message
    try {
      const historyFormatted = (conversationHistory || []).slice(-6).map((item: any) => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content
      }));

      // Augment user prompt with platform context
      const promptWithContext = `${PLATFORM_KNOWLEDGE}\n\nUser Question: ${trimmed}`;

      const aiResponse = await AIEngine.processChat({
        content: promptWithContext,
        mode: 'general' as AlexMode,
        conversationHistory: historyFormatted,
        enableRetrieval: false,
        enableWebResearch: false,
        enableMemory: false,
        enableTools: false,
        enableAgent: false,
      });

      if (aiResponse && aiResponse.message && aiResponse.message.trim().length > 0) {
        return NextResponse.json({
          reply: aiResponse.message,
          source: 'alex_ai'
        });
      }
    } catch (aiError) {
      console.warn('[ALEX Customer Support] AI engine exception, falling back to smart concierge:', aiError);
    }

    // Fallback to high-quality smart concierge reply
    const fallbackReply = getSmartFallbackReply(trimmed);
    return NextResponse.json({
      reply: fallbackReply,
      source: 'smart_concierge'
    });

  } catch (error) {
    console.error('[ALEX Customer Support] Error:', error);
    return NextResponse.json({
      reply: `I'm here to assist you! For immediate help, please reach out to our team and founder Femi Adeleke directly on WhatsApp at [08120934828](https://wa.me/2348120934828) or email autolearnspot@gmail.com.`,
      source: 'error_fallback'
    });
  }
}
