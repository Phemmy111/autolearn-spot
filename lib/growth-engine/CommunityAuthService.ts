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
}
