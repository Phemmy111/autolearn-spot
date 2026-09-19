import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Default skills to seed if the table is empty
const DEFAULT_SKILLS = [
  {
    name: 'AI Automation',
    description: 'Master workflow automation using AI tools like n8n, Make, and Zapier to build powerful, hands-free systems.',
    slug: 'ai-automation',
    icon: 'cpu',
  },
  {
    name: 'AI & Machine Learning',
    description: 'Understand and apply Artificial Intelligence and Machine Learning concepts to real-world problems.',
    slug: 'ai-machine-learning',
    icon: 'brain',
  },
  {
    name: 'Video Content Creation',
    description: 'Create, edit and publish engaging video content using AI-powered tools for platforms like YouTube and TikTok.',
    slug: 'video-content-creation',
    icon: 'video',
  },
  {
    name: 'Digital Marketing',
    description: 'Learn how to grow an audience, run ads, and drive revenue through modern digital marketing strategies.',
    slug: 'digital-marketing',
    icon: 'trending-up',
  },
  {
    name: 'Web Development',
    description: 'Build modern, responsive websites and web applications with the latest tools and frameworks.',
    slug: 'web-development',
    icon: 'code',
  },
  {
    name: 'No-Code Tools',
    description: 'Build powerful apps and automations without writing a single line of code using no-code platforms.',
    slug: 'no-code-tools',
    icon: 'layers',
  },
  {
    name: 'Freelancing & Business',
    description: 'Start and grow a profitable freelance business or online agency with practical, actionable guidance.',
    slug: 'freelancing-business',
    icon: 'briefcase',
  },
  {
    name: 'Prompt Engineering',
    description: 'Learn how to write effective AI prompts to get better results from ChatGPT, Claude, Gemini and more.',
    slug: 'prompt-engineering',
    icon: 'message-square',
  },
];

export async function POST() {
  // Check if skills table is empty
  const { data: existing } = await supabaseAdmin.from('skills').select('id').limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'Skills already seeded', count: existing.length });
  }

  const { data, error } = await supabaseAdmin.from('skills').insert(DEFAULT_SKILLS).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Skills seeded successfully', count: data?.length, data });
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from('skills').select('*').order('name');
  return NextResponse.json({ count: data?.length ?? 0, data, error: error?.message });
}
