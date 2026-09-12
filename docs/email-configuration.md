# Email Configuration Guide

The EmailService uses the same SMTP configuration as existing services (partners, scholarship, etc.).

## Environment Variables

### SMTP Configuration (Required)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=noreply@autolearnspot.com
```

### Founder Email Configuration
```bash
FOUNDER_EMAIL=femiadeleke2020@gmail.com
```
This email address will receive notifications whenever someone submits a new author application.

## Setup Instructions

### For Resend (Recommended for Next.js)
1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Set `EMAIL_PROVIDER=resend` and add your `RESEND_API_KEY`
4. Verify your sender domain in Resend dashboard

### For SendGrid
1. Sign up at https://sendgrid.com
2. Get your API key from the dashboard
3. Set `EMAIL_PROVIDER=sendgrid` and add your `SENDGRID_API_KEY`
4. Configure sender authentication in SendGrid

### For Gmail (using App Passwords)
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the App Password as `SMTP_PASSWORD`
4. Set `EMAIL_PROVIDER=smtp` with Gmail settings

### For Outlook/Office 365
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASSWORD=your_password
```

## Testing Email Configuration

The EmailService includes fallback logging. If email sending fails, it will log the email content to the console for debugging.

## Email Templates

The service includes templates for:
- Application submitted
- Application under review
- Application approved
- Application declined
- Author suspended
- Author reactivated

## Security Notes

- Never commit actual API keys or passwords to version control
- Use environment variables or a secrets manager
- Rotate API keys periodically
- Monitor email delivery rates and spam complaints
