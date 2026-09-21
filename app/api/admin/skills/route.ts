import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { SKILLS_BY_CATEGORY, CATEGORIES } from '@/lib/taxonomy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Convert taxonomy data to flat array for the skills page
  const skillsData = [];
  
  for (const category of CATEGORIES) {
    const skills = SKILLS_BY_CATEGORY[category] || [];
    for (const skill of skills) {
      skillsData.push({
        id: skill.id,
        name: skill.name,
        category: category,
        status: 'Active'
      });
    }
  }

  return NextResponse.json({ data: skillsData });
}
