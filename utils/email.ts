import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: {
    filename: string
    content: Buffer
    contentType: string
  }[]
}

function getCredentials() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587')
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465
  const user = process.env.SMTP_USER || process.env.EMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
  const from = process.env.SMTP_FROM || (user ? `"AutoLearn Spot" <${user}>` : '"AutoLearn Spot" <autolearnspot@gmail.com>')

  return { host, port, isSecure, user, pass, from }
}

export async function sendEmail({ to, subject, html, attachments }: EmailOptions) {
  const creds = getCredentials()

  if (!creds.user || !creds.pass) {
    console.error('SMTP configuration incomplete. User configured:', !!creds.user, 'Pass configured:', !!creds.pass)
    throw new Error('SMTP credentials not configured')
  }

  const transporter = nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.isSecure,
    auth: {
      user: creds.user,
      pass: creds.pass,
    },
  })

  try {
    console.log('Attempting to send email to:', to)
    const info = await transporter.sendMail({
      from: creds.from,
      to,
      subject,
      html,
      attachments,
    })
    console.log('Email sent successfully. Message ID:', info.messageId)
    console.log('SMTP Response:', info.response)
    return info
  } catch (error: any) {
    console.error('Error sending email:', error)
    console.error('SMTP Error Details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    })
    throw error
  }
}
