import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrderById, getOrderItems } from '@/lib/order-service';
import { EmailService } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authorized = await isAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderItems = await getOrderItems(order.id);
    const email = order.customer_email;
    const confirmedFullName = order.customer_name || 'Student';

    const results = [];

    for (const item of orderItems) {
      const { data: product } = await supabaseAdmin
        .from('learning_products')
        .select('*')
        .eq('id', item.learning_product_id)
        .single();

      if (!product) continue;

      let author: any = null;
      if (product.author_id) {
        const { data: authorData } = await supabaseAdmin
          .from('authors')
          .select('display_name, email')
          .eq('id', product.author_id)
          .single();
        author = authorData;
      }

      // 1. Send confirmation to student
      let studentSent = false;
      if (email) {
        studentSent = await EmailService.sendCoursePurchaseConfirmation(
          email,
          confirmedFullName,
          product.title,
          item.price_snapshot,
          order.provider_ref || order.id
        );
      }

      // 2. Send notification to author
      let authorSent = false;
      if (author?.email) {
        const authorEarnings = Math.round(item.price_snapshot * 0.9);
        authorSent = await EmailService.sendCourseSaleNotification(
          author.email,
          author.display_name || 'Author',
          product.title,
          email || 'Student',
          item.price_snapshot,
          authorEarnings
        );
      }

      // 3. Send notification to platform admins
      let adminSent = false;
      try {
        await EmailService.sendCoursePurchaseNotificationToRecipients(
          email || '',
          confirmedFullName,
          product.title,
          item.price_snapshot,
          order.provider_ref || order.id
        );
        const platformCommission = Math.round(item.price_snapshot * 0.1);
        await EmailService.sendFounderCourseSaleNotification(
          product.title,
          author?.display_name || 'Author',
          email || 'Student',
          item.price_snapshot,
          platformCommission
        );
        adminSent = true;
      } catch (err) {
        console.warn('Failed to send admin notification:', err);
      }

      results.push({
        productId: product.id,
        title: product.title,
        studentEmail: email,
        studentSent,
        authorEmail: author?.email,
        authorSent,
        adminSent,
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      results,
    });
  } catch (error: any) {
    console.error('Error in resend-order-emails:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
