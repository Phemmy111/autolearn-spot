import { Video, Calendar, Clock, ExternalLink } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';

interface LiveClassSectionProps {
  productId: string;
  userId: string;
}

export default async function LiveClassSection({ productId, userId }: LiveClassSectionProps) {
  // Fetch upcoming live classes for this product
  const { data: liveClasses } = await supabaseAdmin
    .from('live_classes')
    .select('*')
    .eq('learning_product_id', productId)
    .in('status', ['SCHEDULED', 'LIVE'])
    .order('scheduled_start', { ascending: true })
    .limit(1);

  const upcomingClass = liveClasses?.[0];

  if (!upcomingClass) {
    return (
      <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Video className="w-5 h-5 text-sky-600" />
          <h3 className="font-semibold text-brand-text">Live Classes</h3>
        </div>
        <p className="text-sm text-brand-text/70">
          No upcoming live classes scheduled for this course.
        </p>
      </div>
    );
  }

  const startDate = new Date(upcomingClass.scheduled_start);
  const endDate = new Date(upcomingClass.scheduled_end);

  return (
    <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <Video className="w-5 h-5 text-sky-600" />
        <h3 className="font-semibold text-brand-text">Upcoming Live Class</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-brand-text">{upcomingClass.title}</h4>
          {upcomingClass.description && (
            <p className="text-sm text-brand-text/70 mt-1">{upcomingClass.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-brand-text/60">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {startDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {startDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
        </div>

        <a
          href={upcomingClass.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Video className="w-4 h-4" />
          Join Live Class
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}