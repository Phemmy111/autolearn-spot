import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendContentUnlockNotification } from '@/lib/notification-scheduler'
import { getCurrentCohortId } from '@/lib/progress-service'
import { fulfillCartOrder } from '@/lib/order-fulfillment'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Cron] Starting hourly checks')
    
    // 1. Auto-reconcile recent pending orders with Paystack
    let reconciledCount = 0;
    try {
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (paystackSecret) {
        const { data: pendingOrders } = await supabaseAdmin
          .from('orders')
          .select('id, provider_ref, order_ref, total, customer_email, customer_name, created_at')
          .eq('status', 'PENDING')
          .not('created_at', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20);

        if (pendingOrders && pendingOrders.length > 0) {
          console.log(`[Cron] Checking ${pendingOrders.length} pending order(s) against Paystack...`);
          for (const pOrder of pendingOrders) {
            const refToCheck = pOrder.provider_ref || pOrder.order_ref;
            if (!refToCheck) continue;

            try {
              const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(refToCheck)}`, {
                headers: { Authorization: `Bearer ${paystackSecret}` },
              });
              const verifyData = await verifyRes.json();

              if (verifyData?.status && verifyData?.data?.status === 'success') {
                console.log(`[Cron] Auto-reconciling paid order ${pOrder.id} (ref: ${refToCheck})`);
                const payData = verifyData.data;
                const pCustomerName = [payData.customer?.first_name, payData.customer?.last_name].filter(Boolean).join(' ');
                const res = await fulfillCartOrder({
                  orderId: pOrder.id,
                  reference: refToCheck,
                  customerEmail: payData.customer?.email || pOrder.customer_email,
                  customerName: payData.metadata?.full_name || pCustomerName || pOrder.customer_name,
                  amountInNaira: Math.round(payData.amount / 100),
                  ipAddress: payData.ip_address,
                  affiliateRef: payData.metadata?.affiliate_ref,
                });
                if (res.success) reconciledCount++;
              }
            } catch (pErr) {
              console.warn(`[Cron] Paystack verification failed for ref ${refToCheck}:`, pErr);
            }
          }
        }
      }
    } catch (reconcileErr) {
      console.error('[Cron] Order reconciliation error:', reconcileErr);
    }

    const cohortId = await getCurrentCohortId()
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    
    // Get lessons that become available in the next hour
    const { data: upcomingLessons } = await supabaseAdmin
      .from('lessons')
      .select('id, title, week_number')
      .eq('cohort_id', cohortId)
      .gte('available_at', now.toISOString())
      .lte('available_at', oneHourLater.toISOString())
      .order('available_at', { ascending: true })
    
    if (!upcomingLessons || upcomingLessons.length === 0) {
      console.log('[Cron] No upcoming lessons in the next hour')
      return NextResponse.json({ 
        success: true, 
        message: 'Hourly checks completed (no upcoming lessons)',
        reconciledOrders: reconciledCount,
      })
    }
    
    // Get all active enrollments
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id')
      .eq('cohort_id', cohortId)
      .eq('status', 'active')
    
    if (!enrollments || enrollments.length === 0) {
      console.log('[Cron] No active enrollments found')
      return NextResponse.json({ 
        success: true, 
        message: 'No enrollments to process',
        reconciledOrders: reconciledCount,
      })
    }
    
    let successCount = 0
    let errorCount = 0
    
    for (const lesson of upcomingLessons) {
      for (const enrollment of enrollments) {
        if (enrollment.clerk_user_id) {
          try {
            await sendContentUnlockNotification(
              enrollment.clerk_user_id,
              cohortId,
              'lesson',
              lesson.title,
              `/dashboard/video/${lesson.id}`
            )
            successCount++
          } catch (error) {
            console.error(`[Cron] Failed to send notification to ${enrollment.clerk_user_id}:`, error)
            errorCount++
          }
        }
      }
    }
    
    console.log(`[Cron] Completed: ${successCount} successful, ${errorCount} failed`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Hourly checks completed',
      stats: { success: successCount, failed: errorCount, lessons: upcomingLessons.length },
      reconciledOrders: reconciledCount,
    })
    
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
