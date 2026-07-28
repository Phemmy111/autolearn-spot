# Paystack Webhook Setup

## Environment Variable

Add the following environment variable to your Vercel project:

```
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret
```

## How to Get Paystack Webhook Secret

1. Log in to your Paystack dashboard
2. Go to Settings → API Keys & Webhooks
3. Scroll to Webhooks section
4. Click "Add Webhook"
5. Enter your webhook URL: `https://autolearn-spot.vercel.app/api/webhook/paystack`
6. Select events to listen for: `charge.success`
7. Save the webhook
8. Copy the webhook secret key displayed

## Webhook URL

Production: `https://autolearn-spot.vercel.app/api/webhook/paystack`

## Webhook Events Handled

- `charge.success` - Automatically verifies payment and sends welcome email

## Security

The webhook endpoint verifies Paystack signature using HMAC-SHA512 to ensure requests are genuinely from Paystack.

## Payment Flow with Webhook

1. Applicant clicks payment button
2. Completes payment on Paystack
3. Paystack sends `charge.success` event to webhook
4. Webhook verifies signature
5. Finds application by customer email
6. Updates payment status to "Verified"
7. Sends welcome email automatically
8. No manual intervention required
