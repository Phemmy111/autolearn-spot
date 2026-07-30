// app/api/live-schedule/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin';
import { createNotification } from '@/lib/notifications';

const schedulePath = path.join(process.cwd(), 'data', 'live-schedule.json');

export async function GET() {
  try {
    const data = await fs.promises.readFile(schedulePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    await fs.promises.writeFile(schedulePath, JSON.stringify(body, null, 2), 'utf8');
    
    // Send notification about live class schedule update
    try {
      // Check if there are any upcoming live classes
      const upcomingClasses = body.filter((cls: any) => {
        const classDate = new Date(cls.date);
        const now = new Date();
        return classDate >= now;
      });

      if (upcomingClasses.length > 0) {
        const nextClass = upcomingClasses[0];
        await createNotification({
          title: 'Live Class Schedule Updated',
          message: `The live class schedule has been updated. Next class: ${nextClass.title} on ${new Date(nextClass.date).toLocaleDateString()}`,
          category: 'live_class',
          priority: 'important',
          target_type: 'all',
          action_url: '/live-class',
          action_label: 'View Schedule',
          send_email: true,
          event_id: `live_schedule_update_${Date.now()}`,
        });
      }
    } catch (notifErr) {
      console.error('Failed to send live schedule notification:', notifErr);
      // Don't fail the schedule update if notification fails
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to write schedule' }, { status: 500 });
  }
}
