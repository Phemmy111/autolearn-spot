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
  if (!process.env.SMTP_USER) {
    console.log('No SMTP configuration found, skipping email send to:', to)
    return
  }

  try {
    const info = await transporter.sendMail({
      from: `"AutoLearn Spot" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments,
    })
    console.log('Message sent: %s', info.messageId)
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}
