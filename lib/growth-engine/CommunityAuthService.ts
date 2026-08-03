import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export class CommunityAuthService {
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  static verifyPassword(password: string, storedHash: string): boolean {
    const [salt, key] = storedHash.split(':');
    const hashBuffer = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(hashBuffer, keyBuffer);
  }

  static async authenticate(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('community_ambassadors')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (user.status !== 'active') {
        return { success: false, error: 'Account is not active' };
      }

      if (this.verifyPassword(password, user.password_hash)) {
        // Exclude password hash
        const { password_hash, ...safeUser } = user;
        return { success: true, user: safeUser };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (e) {
      return { success: false, error: 'Internal server error' };
    }
  }

  // Same logic for influencers
  static async authenticateInfluencer(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('influencers')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (user.status !== 'active') {
        return { success: false, error: 'Account is not active' };
      }

      if (this.verifyPassword(password, user.password_hash)) {
        const { password_hash, ...safeUser } = user;
        return { success: true, user: safeUser };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (e) {
      return { success: false, error: 'Internal server error' };
    }
  }

  static async createCommunityAmbassador(params: { email: string; password: string; full_name: string; phone: string }): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const passwordHash = this.hashPassword(params.password);
      
      const { data: user, error } = await supabaseAdmin
        .from('community_ambassadors')
        .insert({
          email: params.email,
          password_hash: passwordHash,
          full_name: params.full_name,
          phone: params.phone,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('[CommunityAuthService] Error creating ambassador:', error);
        return { success: false, error: 'Failed to create account' };
      }

      const { password_hash, ...safeUser } = user;
      return { success: true, user: safeUser };
    } catch (e) {
      console.error('[CommunityAuthService] Exception creating ambassador:', e);
      return { success: false, error: 'Internal server error' };
    }
  }
}
