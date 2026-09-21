# Web Push Notification Setup Guide

This document explains how to set up web push notifications for the AutoLearn Spot messaging system.

## Prerequisites

- Node.js and npm installed
- Access to the project environment variables

## Step 1: Generate VAPID Keys

Run the following command to generate VAPID keys:

```bash
node scripts/generate-vapid-keys.js
```

This will output two keys:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Public key (add to .env)
- `VAPID_PRIVATE_KEY` - Private key (add to .env)

## Step 2: Add Keys to Environment Variables

Add the generated keys to your `.env` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

**Important:** The private key should never be exposed in client-side code. Only the public key is prefixed with `NEXT_PUBLIC_` to make it available to the browser.

## Step 3: Run Database Migration

Execute the SQL schema to create the push subscriptions table:

```bash
# Run the SQL file in your Supabase SQL editor
# or use the Supabase CLI:
supabase db push
```

The schema file is located at: `push-notifications-schema.sql`

## Step 4: Service Worker

The service worker is already created at `public/sw.js`. It will be automatically registered when the app loads (via `ServiceWorkerRegister.tsx` component).

## Step 5: Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to either:
   - `/author/messages` (for authors)
   - `/student/messages` (for students)

3. You should see a banner asking to enable notifications. Click "Enable Notifications".

4. Grant permission in the browser.

5. Send a message to test the push notification.

## How It Works

### Frontend Flow

1. User visits the messages page
2. `PushNotificationOptIn` component shows a banner if notifications aren't enabled
3. User clicks "Enable Notifications"
4. Browser requests notification permission
5. If granted, service worker is registered
6. User is subscribed to push notifications
7. Subscription is saved to the database via `/api/push-subscriptions`

### Backend Flow

1. When a message is sent via `/api/author/messages/conversations/[id]/messages`
2. The system identifies the recipient (author or student)
3. Looks up their push subscription from the database
4. Sends a push notification using web-push library
5. Recipient receives notification even if they're not on the chat page

### Service Worker

The service worker (`public/sw.js`) handles:
- Receiving push notifications
- Displaying notifications to the user
- Handling notification clicks (opens the app)

## API Endpoints

### `GET /api/push-subscriptions`
Get current user's push subscription
- Authenticated users only

### `POST /api/push-subscriptions`
Save a push subscription
- Body: `{ subscription: object, user_type: 'student' | 'author' }`
- Authenticated users only

### `DELETE /api/push-subscriptions`
Remove push subscription
- Authenticated users only

## Features

- ✅ Push notifications for new messages
- ✅ Works when user is not actively using the chat
- ✅ Notifications work even when browser is closed (on supported browsers)
- ✅ User opt-in flow
- ✅ Graceful fallback if push fails
- ✅ Subscription management (add/remove)
- ✅ RLS policies to protect user subscriptions

## Browser Support

Web push notifications work on:
- Chrome (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (macOS, iOS 16.4+)
- Edge (desktop and mobile)

## Troubleshooting

### Notifications not appearing

1. Check browser permissions: Ensure notifications are allowed for your domain
2. Check VAPID keys: Ensure they're correctly set in .env
3. Check service worker: Open DevTools > Application > Service Workers to verify it's registered
4. Check console for errors: Look for any errors in the browser console

### "VAPID keys not configured" warning

This warning appears if the environment variables are not set. Generate and add them as described in Step 1-2.

### Service worker not registering

1. Ensure the app is served over HTTPS (required for service workers)
2. In development, `localhost` is allowed
3. Check the console for registration errors

## Future Enhancements

- Group notifications (batch multiple messages)
- Notification preferences (mute specific conversations)
- Notification history
- Sound customization
- Rich notifications with images
