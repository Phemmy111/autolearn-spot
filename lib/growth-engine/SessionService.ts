import crypto from 'crypto';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET_KEY || 'default-secret-key-for-dev-only-please-change-in-prod';

export class SessionService {
  static async createSession(userId: string, role: 'community' | 'influencer') {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
    
    const payload = Buffer.from(JSON.stringify({ userId, role, exp: expires.getTime() })).toString('base64');
    const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('base64');
    const session = `${payload}.${signature}`;

    const cookieStore = await cookies();
    cookieStore.set('growth_session', session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  static async getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('growth_session')?.value;
    if (!session) return null;

    try {
      const [payload, signature] = session.split('.');
      if (!payload || !signature) return null;

      const expectedSignature = crypto.createHmac('sha256', secretKey).update(payload).digest('base64');
      if (signature !== expectedSignature) return null;

      const parsed = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
      if (parsed.exp < Date.now()) return null;

      return { userId: parsed.userId, role: parsed.role } as { userId: string; role: 'community' | 'influencer' };
    } catch (error) {
      return null;
    }
  }

  static async destroySession() {
    const cookieStore = await cookies();
    cookieStore.delete('growth_session');
  }
}
