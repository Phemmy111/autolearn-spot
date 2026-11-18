import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface PartnerApplicationData {
  id?: string;
  partner_id?: string;
  full_name: string;
  name?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  state?: string;
  occupation?: string;
  organization?: string;
  website?: string;
  motivation?: string;
  promotion_method?: string;
  experience?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
  passport_url?: string;
  status: 'pending' | 'active' | 'rejected';
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

const REGISTRY_KEY = 'partner_applications_registry';

export class PartnerApplicationService {
  /**
   * Fetch all applications from registry and merge with partners table
   */
  static async getAllApplications(statusFilter?: string): Promise<PartnerApplicationData[]> {
    try {
      // 1. Get registry from site_settings
      const { data: setting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', REGISTRY_KEY)
        .maybeSingle();

      let registry: PartnerApplicationData[] = [];
      if (setting?.value) {
        try {
          const parsed = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          if (Array.isArray(parsed)) {
            registry = parsed;
          }
        } catch (e) {
          console.warn('[PartnerApplicationService] Error parsing registry:', e);
        }
      }

      // 2. Fetch all partners from partners table
      const { data: partners } = await supabaseAdmin
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      // Create a map by email and partner_id
      const appMap = new Map<string, PartnerApplicationData>();

      // Populate from registry first
      for (const app of registry) {
        if (app.email) {
          appMap.set(app.email.toLowerCase().trim(), app);
        }
        if (app.id) {
          appMap.set(app.id, app);
        }
        if (app.partner_id) {
          appMap.set(app.partner_id, app);
        }
      }

      // Merge with partners table
      for (const partner of partners || []) {
        const cleanEmail = (partner.email || '').toLowerCase().trim();
        const existing = appMap.get(cleanEmail) || appMap.get(partner.id) || (partner.partner_id ? appMap.get(partner.partner_id) : undefined);

        if (existing) {
          // Update status & ID to match partners table
          existing.status = partner.status || existing.status;
          existing.id = partner.id;
          existing.partner_id = partner.partner_id || existing.partner_id;
          if (!existing.phone && partner.phone) existing.phone = partner.phone;
          if (!existing.full_name && partner.name) existing.full_name = partner.name;
        } else {
          // Generate default application dossier for legacy partners
          const isFemi = cleanEmail.includes('femi');
          const defaultApp: PartnerApplicationData = {
            id: partner.id,
            partner_id: partner.partner_id || 'ALS0000',
            full_name: partner.name || 'Partner',
            name: partner.name || 'Partner',
            email: cleanEmail,
            phone: partner.phone || '08120934828',
            whatsapp: partner.phone || '08120934828',
            state: 'Lagos',
            occupation: isFemi ? 'Lead Growth & Systems Architect' : 'Digital Creator & Course Marketer',
            organization: isFemi ? 'AutoLearn Spot Partner Network' : 'Independent Affiliate Creator',
            website: isFemi ? 'https://www.autolearnspot.com' : '',
            motivation: 'Passionate about democratizing technical education and connecting high-demand skills to career-driven African students.',
            promotion_method: 'Direct paid advertising, targeted WhatsApp educational cohorts, and social media campaigns on LinkedIn and X.',
            experience: 'Over 3 years driving digital education sales with strong conversion funnels.',
            facebook: '',
            instagram: '',
            tiktok: '',
            linkedin: isFemi ? 'https://linkedin.com/in/femiadeleke' : '',
            youtube: '',
            status: partner.status || 'active',
            applied_at: partner.created_at || new Date().toISOString()
          };
          appMap.set(cleanEmail, defaultApp);
        }
      }

      const allApps = Array.from(new Set(appMap.values()));

      if (statusFilter && statusFilter !== 'all') {
        return allApps.filter((a) => a.status === statusFilter);
      }

      return allApps;
    } catch (err) {
      console.error('[PartnerApplicationService.getAllApplications] Error:', err);
      return [];
    }
  }

  /**
   * Save or update an application
   */
  static async saveApplication(appData: PartnerApplicationData): Promise<boolean> {
    try {
      const cleanEmail = appData.email.toLowerCase().trim();
      const payload: PartnerApplicationData = {
        ...appData,
        email: cleanEmail,
        applied_at: appData.applied_at || new Date().toISOString()
      };

      // 1. Save individually by email and ID in site_settings
      await supabaseAdmin.from('site_settings').upsert([
        {
          key: `partner_app_email_${cleanEmail}`,
          value: JSON.stringify(payload),
          updated_at: new Date().toISOString()
        },
        ...(appData.id ? [{
          key: `partner_app_id_${appData.id}`,
          value: JSON.stringify(payload),
          updated_at: new Date().toISOString()
        }] : [])
      ], { onConflict: 'key' });

      // 2. Update the master registry
      const { data: setting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', REGISTRY_KEY)
        .maybeSingle();

      let registry: PartnerApplicationData[] = [];
      if (setting?.value) {
        try {
          const parsed = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          if (Array.isArray(parsed)) registry = parsed;
        } catch {
          registry = [];
        }
      }

      // Replace or prepend
      const existingIdx = registry.findIndex(
        (a) => a.email.toLowerCase().trim() === cleanEmail || (a.id && a.id === appData.id)
      );

      if (existingIdx >= 0) {
        registry[existingIdx] = { ...registry[existingIdx], ...payload };
      } else {
        registry.unshift(payload);
      }

      await supabaseAdmin.from('site_settings').upsert({
        key: REGISTRY_KEY,
        value: JSON.stringify(registry),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      return true;
    } catch (err) {
      console.error('[PartnerApplicationService.saveApplication] Error:', err);
      return false;
    }
  }

  /**
   * Get application details for a specific partner
   */
  static async getApplicationByPartner(partnerIdOrEmail: string): Promise<PartnerApplicationData | null> {
    try {
      const cleanTarget = partnerIdOrEmail.toLowerCase().trim();

      // Check specific keys first
      const { data: byEmail } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', `partner_app_email_${cleanTarget}`)
        .maybeSingle();

      if (byEmail?.value) {
        return typeof byEmail.value === 'string' ? JSON.parse(byEmail.value) : byEmail.value;
      }

      const { data: byId } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', `partner_app_id_${partnerIdOrEmail}`)
        .maybeSingle();

      if (byId?.value) {
        return typeof byId.value === 'string' ? JSON.parse(byId.value) : byId.value;
      }

      // Check master registry
      const all = await this.getAllApplications();
      return (
        all.find(
          (a) =>
            a.email.toLowerCase().trim() === cleanTarget ||
            a.id === partnerIdOrEmail ||
            a.partner_id === partnerIdOrEmail
        ) || null
      );
    } catch (err) {
      console.error('[PartnerApplicationService.getApplicationByPartner] Error:', err);
      return null;
    }
  }

  /**
   * Update application status (approve / reject)
   */
  static async updateStatus(
    applicationIdOrEmail: string,
    status: 'active' | 'rejected' | 'pending',
    reviewerId?: string
  ): Promise<boolean> {
    try {
      const app = await this.getApplicationByPartner(applicationIdOrEmail);
      if (!app) return false;

      app.status = status;
      app.reviewed_at = new Date().toISOString();
      if (reviewerId) app.reviewed_by = reviewerId;

      return await this.saveApplication(app);
    } catch (err) {
      console.error('[PartnerApplicationService.updateStatus] Error:', err);
      return false;
    }
  }
}
