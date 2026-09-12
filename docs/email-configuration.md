# Email Configuration Guide

The EmailService now supports multiple email providers. Configure your preferred provider by setting the appropriate environment variables.

## Environment Variables

### Choose Your Email Provider
```bash
EMAIL_PROVIDER=smtp  # Options: 'resend', 'sendgrid', or 'smtp'
```

### Resend Configuration (Recommended)
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxx
EMAIL_FROM=AutoLearn Spot <noreply@autolearnspot.com>
```

### SendGrid Configuration
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxx
EMAIL_FROM=AutoLearn Spot <noreply@autolearnspot.com>
```

### SMTP Configuration (Gmail, Outlook, Custom)
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
EMAIL_FROM=AutoLearn Spot <noreply@autolearnspot.com>
```

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
