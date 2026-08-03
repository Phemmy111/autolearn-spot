import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MarketingResource {
  type: string;
  name: string;
  url: string;
  description?: string;
}

const MARKETING_RESOURCES: MarketingResource[] = [
  {
    type: 'flyer',
    name: 'AutoLearn Spot Training Flyer',
    url: '/marketing/autolearn-spot-flyer.pdf',
    description: 'Professional flyer for promoting the AI Automation Training'
  },
  {
    type: 'flyer',
    name: 'Partner Program Flyer',
    url: '/marketing/partner-program-flyer.pdf',
    description: 'Flyer for recruiting new partners'
  },
  {
    type: 'video',
    name: 'Course Overview Video',
    url: '/marketing/course-overview.mp4',
    description: 'Short video overview of the training program'
  },
  {
    type: 'video',
    name: 'Partner Promo Video',
    url: '/marketing/partner-promo.mp4',
    description: 'Promotional video for the partner program'
  },
  {
    type: 'poster',
    name: 'Training Poster (A3)',
    url: '/marketing/training-poster-a3.pdf',
    description: 'Large format poster for campus events'
  },
  {
    type: 'poster',
    name: 'Training Poster (A4)',
    url: '/marketing/training-poster-a4.pdf',
    description: 'Standard size poster for general use'
  },
  {
    type: 'logo',
    name: 'AutoLearn Spot Logo (PNG)',
    url: '/marketing/logo-transparent.png',
    description: 'Transparent background logo'
  },
  {
    type: 'logo',
    name: 'AutoLearn Spot Logo (SVG)',
    url: '/marketing/logo-vector.svg',
    description: 'Vector format logo for professional use'
  },
  {
    type: 'guide',
    name: 'Referral Guide',
    url: '/marketing/referral-guide.pdf',
    description: 'Comprehensive guide on how to effectively refer students'
  },
  {
    type: 'caption',
    name: 'WhatsApp Captions',
    url: '/marketing/whatsapp-captions.txt',
    description: 'Ready-to-use WhatsApp message templates'
  },
  {
    type: 'template',
    name: 'Email Templates',
    url: '/marketing/email-templates.zip',
    description: 'Professional email templates for outreach'
  },
  {
    type: 'template',
    name: 'Social Media Posts',
    url: '/marketing/social-media-templates.zip',
    description: 'Social media post templates and graphics'
  }
];

export class PartnerMarketingService {
  /**
   * Get all marketing resources
   */
  static async getMarketingResources(): Promise<MarketingResource[]> {
    return MARKETING_RESOURCES;
  }

  /**
   * Get resources by type
   */
  static async getResourcesByType(type: string): Promise<MarketingResource[]> {
    return MARKETING_RESOURCES.filter(resource => resource.type === type);
  }

  /**
   * Record download of a marketing resource
   */
  static async recordDownload(
    partnerId: string,
    resourceType: string,
    resourceName: string,
    resourceUrl: string
  ): Promise<boolean> {
    try {
      // Check if resource already exists for this partner
      const { data: existingDownload, error: existingError } = await supabase
        .from('partner_marketing_downloads')
        .select('id, download_count')
        .eq('partner_id', partnerId)
        .eq('resource_name', resourceName)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing download:', existingError);
        return false;
      }

      if (existingDownload) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('partner_marketing_downloads')
          .update({
            download_count: existingDownload.download_count + 1,
            last_downloaded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDownload.id);

        if (updateError) {
          console.error('Error updating download:', updateError);
          return false;
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('partner_marketing_downloads')
          .insert({
            partner_id: partnerId,
            resource_type: resourceType,
            resource_name: resourceName,
            resource_url: resourceUrl,
            download_count: 1,
            last_downloaded_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error recording download:', insertError);
          return false;
        }
      }

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: partnerId,
        activity_type: 'marketing_download',
        activity_data: {
          resource_type: resourceType,
          resource_name: resourceName
        }
      });

      return true;
    } catch (error) {
      console.error('Error recording download:', error);
      return false;
    }
  }

  /**
   * Get download history for a partner
   */
  static async getDownloadHistory(partnerId: string): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('partner_marketing_downloads')
        .select('*')
        .eq('partner_id', partnerId)
        .order('last_downloaded_at', { ascending: false });

      if (error) {
        console.error('Error getting download history:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getDownloadHistory:', error);
      return null;
    }
  }

  /**
   * Get popular resources across all partners
   */
  static async getPopularResources(limit: number = 10): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('partner_marketing_downloads')
        .select('resource_type, resource_name, resource_url, download_count')
        .order('download_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting popular resources:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPopularResources:', error);
      return null;
    }
  }

  /**
   * Get download statistics for a partner
   */
  static async getDownloadStats(partnerId: string): Promise<{
    totalDownloads: number;
    downloadsByType: Record<string, number>;
    mostDownloaded: string;
  } | null> {
    try {
      const { data: downloads, error } = await supabase
        .from('partner_marketing_downloads')
        .select('resource_type, download_count')
        .eq('partner_id', partnerId);

      if (error) {
        console.error('Error getting download stats:', error);
        return null;
      }

      const totalDownloads = downloads?.reduce((sum, d) => sum + (d.download_count || 0), 0) || 0;
      
      const downloadsByType: Record<string, number> = {};
      downloads?.forEach(d => {
        downloadsByType[d.resource_type] = (downloadsByType[d.resource_type] || 0) + (d.download_count || 0);
      });

      const mostDownloaded = downloads?.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))[0]?.resource_type || 'None';

      return {
        totalDownloads,
        downloadsByType,
        mostDownloaded
      };
    } catch (error) {
      console.error('Error in getDownloadStats:', error);
      return null;
    }
  }
}