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

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({ to, subject, html, attachments }: EmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('SMTP configuration incomplete. SMTP_USER:', !!process.env.SMTP_USER, 'SMTP_PASS:', !!process.env.SMTP_PASS)
    throw new Error('SMTP credentials not configured')
  }

  console.log('SMTP Configuration:', {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || '587',
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
  })

  try {
    console.log('Attempting to send email to:', to)
    const info = await transporter.sendMail({
      from: `"AutoLearn Spot" <${process.env.SMTP_USER}>`,
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
