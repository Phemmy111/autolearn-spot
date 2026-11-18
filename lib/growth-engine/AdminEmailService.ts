import nodemailer from 'nodemailer';

function getAdminEmailCredentials() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  const from = process.env.SMTP_FROM || (user ? `"AutoLearn Spot" <${user}>` : '"AutoLearn Spot" <autolearnspot@gmail.com>');
  
  const recipientList = [
    'autolearnspot@gmail.com',
    'femiadeleke2020@gmail.com',
    process.env.ADMIN_EMAIL,
    process.env.FOUNDER_EMAIL,
    process.env.OWNER_EMAIL,
  ].filter(Boolean) as string[];
  
  const dedupedRecipients = Array.from(new Set(recipientList.map(e => e.trim().toLowerCase())));

  return { host, port, isSecure, user, pass, from, adminEmail: dedupedRecipients.join(', ') };
}

function getTransporter() {
  const creds = getAdminEmailCredentials();
  return nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.isSecure,
    auth: creds.user && creds.pass ? {
      user: creds.user,
      pass: creds.pass,
    } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.FOUNDER_EMAIL || 'autolearnspot@gmail.com';

export class AdminEmailService {
  /**
   * Send notification when a new student registers
   */
  static async sendStudentRegistrationEmail(studentData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    state: string;
    occupation: string;
    gender: string;
    referralSource: string;
    referralCode?: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: getAdminEmailCredentials().from,
        to: ADMIN_EMAIL,
        subject: '🎓 New Student Registration - AutoLearn Spot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0e12; color: #e2e2e8;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00f0ff; margin: 0;">AutoLearn Spot</h1>
              <p style="color: #b9cacb; margin: 5px 0;">New Student Registration</p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #00f0ff; margin-top: 0;">Student Details</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Full Name:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.fullName}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Email:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.email}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Phone Number:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.phoneNumber}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">State:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.state}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Occupation:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.occupation}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Gender:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.gender}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Referral Source:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.referralSource}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Referral Code:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.referralCode || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #b9cacb; margin: 0; font-size: 14px;">
                <strong>Registration Status:</strong> <span style="color: #ffcc00;">Pending Payment</span>
              </p>
              <p style="color: #b9cacb; margin: 5px 0 0 0; font-size: 14px;">
                <strong>Cohort:</strong> <span style="color: #00f0ff;">Cohort 2</span>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #b9cacb; font-size: 12px;">
                This is an automated notification from AutoLearn Spot.
              </p>
            </div>
          </div>
        `,
      };

      await getTransporter().sendMail(mailOptions);
      console.log('[AdminEmailService] Student registration email sent successfully');
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending student registration email:', error);
      return false;
    }
  }

  /**
   * Send notification when a student completes payment successfully
   */
  static async sendStudentPaymentEmail(studentData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    paymentAmount: number;
    paymentReference: string;
    cohort?: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: getAdminEmailCredentials().from,
        to: ADMIN_EMAIL,
        subject: '💰 Payment Successful - AutoLearn Spot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0e12; color: #e2e2e8;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00f0ff; margin: 0;">AutoLearn Spot</h1>
              <p style="color: #b9cacb; margin: 5px 0;">Payment Successful</p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #00f0ff; margin-top: 0;">Payment Details</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Student Name:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.fullName}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Email:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.email}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Phone Number:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${studentData.phoneNumber}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Payment Amount:</p>
                  <p style="color: #00f0ff; margin: 0; font-weight: bold; font-size: 18px;">₦${studentData.paymentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Payment Reference:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold; font-family: monospace;">${studentData.paymentReference}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Cohort:</p>
                  <p style="color: #00f0ff; margin: 0; font-weight: bold;">${studentData.cohort || 'Cohort 2'}</p>
                </div>
              </div>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #00ff00; margin: 0; font-size: 16px; font-weight: bold; text-align: center;">
                ✅ PAYMENT SUCCESSFUL
              </p>
              <p style="color: #b9cacb; margin: 10px 0 0 0; font-size: 14px; text-align: center;">
                Student account has been created and activated.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #b9cacb; font-size: 12px;">
                This is an automated notification from AutoLearn Spot.
              </p>
            </div>
          </div>
        `,
      };

      await getTransporter().sendMail(mailOptions);
      console.log('[AdminEmailService] Student payment email sent successfully');
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending student payment email:', error);
      return false;
    }
  }

  /**
   * Send notification when a new partner is created manually by admin
   */
  static async sendPartnerCreatedEmail(partnerData: {
    partnerName: string;
    partnerEmail: string;
    partnerType: string;
    partnerId: string;
    referralCode: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: getAdminEmailCredentials().from,
        to: ADMIN_EMAIL,
        subject: '🤝 New Partner Created - AutoLearn Spot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0e12; color: #e2e2e8;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00f0ff; margin: 0;">AutoLearn Spot</h1>
              <p style="color: #b9cacb; margin: 5px 0;">New Partner Created</p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #00f0ff; margin-top: 0;">Partner Details</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Partner Name:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${partnerData.partnerName}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Email:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${partnerData.partnerEmail}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Partner Type:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${partnerData.partnerType}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Partner ID:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold; font-family: monospace;">${partnerData.partnerId}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Referral Code:</p>
                  <p style="color: #00f0ff; margin: 0; font-weight: bold; font-family: monospace;">${partnerData.referralCode}</p>
                </div>
              </div>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #00ff00; margin: 0; font-size: 16px; font-weight: bold; text-align: center;">
                ✅ PARTNER ACCOUNT CREATED
              </p>
              <p style="color: #b9cacb; margin: 10px 0 0 0; font-size: 14px; text-align: center;">
                Welcome email has been sent to the partner with login details.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #b9cacb; font-size: 12px;">
                This is an automated notification from AutoLearn Spot.
              </p>
            </div>
          </div>
        `,
      };

      await getTransporter().sendMail(mailOptions);
      console.log('[AdminEmailService] Partner created email sent successfully');
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending partner created email:', error);
      return false;
    }
  }

  /**
   * Send welcome email to new partner with login details
   */
  static async sendPartnerWelcomeEmail(partnerData: {
    partnerName: string;
    partnerEmail: string;
    partnerId: string;
    partnerType: string;
    referralCode: string;
    tempPassword: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: getAdminEmailCredentials().from,
        to: partnerData.partnerEmail,
        subject: '🎉 Welcome to AutoLearn Spot Partner Program',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0e12; color: #e2e2e8;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00f0ff; margin: 0;">AutoLearn Spot</h1>
              <p style="color: #b9cacb; margin: 5px 0;">Partner Program</p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #00f0ff; margin-top: 0;">Welcome to the Team!</h2>
              <p style="color: #e2e2e8; margin: 10px 0;">Dear ${partnerData.partnerName},</p>
              <p style="color: #b9cacb; margin: 10px 0;">
                Congratulations! You have been successfully added to the AutoLearn Spot Partner Program as a <strong style="color: #00f0ff;">${partnerData.partnerType.toUpperCase()}</strong> partner. Your account is now active and ready to start earning commissions.
              </p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #00f0ff; margin-top: 0;">Your Account Details</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Partner Type:</p>
                  <p style="color: #00f0ff; margin: 0; font-weight: bold; text-transform: uppercase;">${partnerData.partnerType}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Partner ID:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold; font-family: monospace;">${partnerData.partnerId}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Referral Code:</p>
                  <p style="color: #00f0ff; margin: 0; font-weight: bold; font-family: monospace;">${partnerData.referralCode}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Password:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold; font-family: monospace;">${partnerData.tempPassword}</p>
                </div>
              </div>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #00f0ff; margin-top: 0;">Getting Started</h3>
              <ul style="color: #b9cacb; margin: 10px 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Login to your partner dashboard at <a href="https://www.autolearnspot.com/partners/login" style="color: #00f0ff;">autolearnspot.com/partners/login</a></li>
                <li style="margin-bottom: 10px;">Access your marketing materials and referral link</li>
                <li style="margin-bottom: 10px;">Start sharing your referral code to earn commissions</li>
                <li style="margin-bottom: 10px;">Track your performance and earnings in real-time</li>
              </ul>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #00f0ff; margin-top: 0;">Commission Structure</h3>
              <p style="color: #b9cacb; margin: 10px 0;">
                <strong style="color: #e2e2e8;">${partnerData.partnerType === 'influencer' ? '₦3,000' : partnerData.partnerType === 'community' ? '₦2,000' : '₦1,500'}</strong> per successful enrollment
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #b9cacb; font-size: 12px;">
                If you have any questions, please don't hesitate to reach out.
              </p>
              <p style="color: #b9cacb; font-size: 12px; margin-top: 10px;">
                Best regards,<br>AutoLearn Spot Team
              </p>
            </div>
          </div>
        `,
      };

      await getTransporter().sendMail(mailOptions);
      console.log('[AdminEmailService] Partner welcome email sent successfully');
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending partner welcome email:', error);
      return false;
    }
  }

  /**
   * Send notification when someone applies for partnership
   */
  static async sendPartnerApplicationEmail(applicationData: {
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string;
    whatsapp?: string;
    state?: string;
    occupation?: string;
    organization?: string;
    partnerType?: string;
    motivation?: string;
    promotionMethod?: string;
    experience?: string;
    website?: string;
    partnerId?: string;
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      tiktok?: string;
      linkedin?: string;
      youtube?: string;
    };
  }): Promise<boolean> {
    try {
      const creds = getAdminEmailCredentials();
      const whatsappNumber = applicationData.whatsapp || applicationData.applicantPhone || '';
      const cleanWa = whatsappNumber.replace(/[^0-9]/g, '');
      const waLink = cleanWa ? `https://wa.me/${cleanWa.startsWith('0') ? '234' + cleanWa.slice(1) : cleanWa}` : '';

      const mailOptions = {
        from: creds.from,
        to: creds.adminEmail,
        subject: `🔥 New Partner Application: ${applicationData.applicantName} (${applicationData.partnerId || 'ALS'}) - AutoLearn Spot`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; background-color: #0b0f19; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 20px;">
              <h1 style="color: #10b981; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">AutoLearn Spot</h1>
              <p style="color: #94a3b8; margin: 6px 0 0; font-size: 14px;">Affiliate Partnership Application Dossier</p>
            </div>
            
            <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 style="color: #38bdf8; margin: 0; font-size: 18px;">👤 Applicant Profile</h2>
                <span style="background-color: #064e3b; color: #34d399; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 9999px;">
                  ${applicationData.partnerId || 'NEW APPLICANT'}
                </span>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; width: 35%;">Full Name:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-weight: 600;">${applicationData.applicantName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">Email Address:</td>
                  <td style="padding: 8px 0; color: #38bdf8; font-weight: 600;"><a href="mailto:${applicationData.applicantEmail}" style="color: #38bdf8; text-decoration: none;">${applicationData.applicantEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">Phone Number:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-weight: 600;"><a href="tel:${applicationData.applicantPhone || ''}" style="color: #ffffff; text-decoration: none;">${applicationData.applicantPhone || 'N/A'}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">WhatsApp Number:</td>
                  <td style="padding: 8px 0; color: #10b981; font-weight: 600;">
                    ${whatsappNumber ? `<a href="${waLink}" style="color: #10b981; text-decoration: underline; font-weight: bold;">${whatsappNumber} (Chat on WhatsApp ↗)</a>` : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">State / Location:</td>
                  <td style="padding: 8px 0; color: #ffffff;">${applicationData.state || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">Occupation:</td>
                  <td style="padding: 8px 0; color: #ffffff;">${applicationData.occupation || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">Organization:</td>
                  <td style="padding: 8px 0; color: #ffffff;">${applicationData.organization || 'Independent'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">Website / Portfolio:</td>
                  <td style="padding: 8px 0; color: #38bdf8;">
                    ${applicationData.website ? `<a href="${applicationData.website}" target="_blank" style="color: #38bdf8;">${applicationData.website}</a>` : 'None provided'}
                  </td>
                </tr>
              </table>
            </div>

            <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #f59e0b; margin: 0 0 12px; font-size: 16px;">🎯 Motivation & Promotion Plan</h3>
              <div style="margin-bottom: 14px;">
                <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 4px; font-weight: bold;">Why they want to partner with us:</p>
                <div style="background-color: #0b0f19; padding: 12px; border-radius: 8px; border-left: 3px solid #10b981; color: #e2e8f0; font-size: 14px; line-height: 1.5;">
                  ${applicationData.motivation || 'No motivation provided.'}
                </div>
              </div>

              <div>
                <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 4px; font-weight: bold;">Planned Promotion Channels:</p>
                <div style="background-color: #0b0f19; padding: 12px; border-radius: 8px; border-left: 3px solid #38bdf8; color: #e2e8f0; font-size: 14px; line-height: 1.5;">
                  ${applicationData.promotionMethod || 'Direct outreach and community sharing'}
                </div>
              </div>

              ${applicationData.experience ? `
              <div style="margin-top: 14px;">
                <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 4px; font-weight: bold;">Past Marketing Experience:</p>
                <div style="background-color: #0b0f19; padding: 12px; border-radius: 8px; border-left: 3px solid #a855f7; color: #e2e8f0; font-size: 14px; line-height: 1.5;">
                  ${applicationData.experience}
                </div>
              </div>` : ''}
            </div>
            
            <div style="text-align: center; margin: 28px 0 16px;">
              <a href="https://www.autolearnspot.com/admin/partners" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);">
                Review Application in Admin Hub →
              </a>
            </div>

            <div style="text-align: center; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 20px;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Delivered automatically to AutoLearn Spot Administrators (${creds.adminEmail}).
              </p>
            </div>
          </div>
        `,
      };

      if (!creds.user || !creds.pass) {
        console.warn('[AdminEmailService] SMTP credentials missing in environment (SMTP_USER/SMTP_PASS). Email logged for administrative review:', {
          recipients: creds.adminEmail,
          applicant: applicationData.applicantName,
          email: applicationData.applicantEmail
        });
        return false;
      }

      await getTransporter().sendMail(mailOptions);
      console.log('[AdminEmailService] Partner application email sent successfully to:', creds.adminEmail);
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending partner application email:', error);
      return false;
    }
  }

  /**
   * Send notification when a visitor submits an inquiry via ALEX Customer Service
   */
  static async sendCustomerInquiryEmail(inquiryData: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    message: string;
    pageUrl?: string;
  }): Promise<boolean> {
    try {
      const creds = getAdminEmailCredentials();
      const cleanPhone = (inquiryData.phoneNumber || '').replace(/[^0-9]/g, '');
      const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone}` : '';

      const mailOptions = {
        from: creds.from,
        to: creds.adminEmail,
        subject: `⚡ New Customer Lead from ALEX: ${inquiryData.fullName} - AutoLearn Spot`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b0f19; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 16px;">
              <h1 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 800;">AutoLearn Spot</h1>
              <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">ALEX AI Customer Support Lead Alert</p>
            </div>

            <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
              <h3 style="color: #38bdf8; margin: 0 0 12px; font-size: 16px;">Contact Information</h3>
              <p style="margin: 6px 0; color: #e2e8f0;"><strong>Name:</strong> ${inquiryData.fullName}</p>
              <p style="margin: 6px 0; color: #e2e8f0;"><strong>Email:</strong> <a href="mailto:${inquiryData.email}" style="color: #38bdf8;">${inquiryData.email}</a></p>
              <p style="margin: 6px 0; color: #e2e8f0;">
                <strong>Phone / WhatsApp:</strong> 
                ${inquiryData.phoneNumber ? `<a href="${waLink}" style="color: #10b981; font-weight: bold; text-decoration: underline;">${inquiryData.phoneNumber} (Chat on WhatsApp ↗)</a>` : 'Not provided'}
              </p>
              ${inquiryData.pageUrl ? `<p style="margin: 6px 0; color: #94a3b8; font-size: 12px;"><strong>Source Page:</strong> ${inquiryData.pageUrl}</p>` : ''}
            </div>

            <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
              <h3 style="color: #f59e0b; margin: 0 0 8px; font-size: 15px;">Inquiry / Message</h3>
              <div style="background-color: #0b0f19; padding: 12px; border-radius: 8px; border-left: 3px solid #10b981; color: #ffffff; font-size: 14px; line-height: 1.5;">
                ${inquiryData.message}
              </div>
            </div>

            ${waLink ? `
            <div style="text-align: center; margin: 24px 0 12px;">
              <a href="${waLink}" style="background-color: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                Reply Directly on WhatsApp 💬
              </a>
            </div>` : ''}
          </div>
        `
      };

      if (!creds.user || !creds.pass) {
        console.warn('[AdminEmailService] SMTP credentials missing in environment. Lead inquiry logged:', inquiryData);
        return false;
      }

      await getTransporter().sendMail(mailOptions);
      console.log('[AdminEmailService] Customer inquiry email sent successfully to:', creds.adminEmail);
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending customer inquiry email:', error);
      return false;
    }
  }

  /**
   * Send notification to admin when a partner successfully refers a student
   */
  static async sendAdminPartnerReferralNotification(referralData: {
    partnerName: string;
    partnerEmail: string;
    partnerType: string;
    refereeEmail: string;
    commissionAmount: number;
    referralCode: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: getAdminEmailCredentials().from,
        to: ADMIN_EMAIL,
        subject: '🎯 Partner Referral Success - AutoLearn Spot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0e12; color: #e2e2e8;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00f0ff; margin: 0;">AutoLearn Spot</h1>
              <p style="color: #b9cacb; margin: 5px 0;">Partner Referral Success</p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #00f0ff; margin-top: 0;">Partner Details</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Partner Name:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${referralData.partnerName}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Partner Email:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${referralData.partnerEmail}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Partner Type:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold; capitalize;">${referralData.partnerType}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Referral Code:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold; font-family: monospace;">${referralData.referralCode}</p>
                </div>
              </div>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #00f0ff; margin-top: 0;">Referral Details</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Referee Email:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${referralData.refereeEmail}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Commission Amount:</p>
                  <p style="color: #00f0ff; margin: 0; font-weight: bold; font-size: 18px;">₦${referralData.commissionAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #00f0ff; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #00f0ff; margin: 0; font-size: 16px; font-weight: bold; text-align: center;">
                ✅ SUCCESSFUL REFERRAL
              </p>
              <p style="color: #b9cacb; margin: 10px 0 0 0; font-size: 14px; text-align: center;">
                Partner has successfully referred a new student who completed enrollment.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #b9cacb; font-size: 12px;">
                This is an automated notification from AutoLearn Spot.
              </p>
            </div>
          </div>
        `,
      };

      await getTransporter().sendMail(mailOptions);
      console.log('[AdminEmailService] Admin partner referral notification sent successfully');
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending admin partner referral notification:', error);
      return false;
    }
  }

  /**
   * Send notification to partner when they get a successful referral
   */
  static async sendPartnerReferralEmail(referralData: {
    partnerName: string;
    partnerEmail: string;
    refereeEmail: string;
    commissionAmount: number;
    referralCode: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: getAdminEmailCredentials().from,
        to: referralData.partnerEmail,
        subject: '💰 New Successful Referral - AutoLearn Spot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0e12; color: #e2e2e8;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00f0ff; margin: 0;">AutoLearn Spot</h1>
              <p style="color: #b9cacb; margin: 5px 0;">Commission Earned!</p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #00f0ff; margin-top: 0;">Congratulations!</h2>
              <p style="color: #e2e2e8; margin: 10px 0;">Dear ${referralData.partnerName},</p>
              <p style="color: #b9cacb; margin: 10px 0;">
                You've earned a commission from a successful referral using your code!
              </p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #00f0ff; margin-top: 0;">Referral Details</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Referee Email:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${referralData.refereeEmail}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Referral Code Used:</p>
                  <p style="color: #00f0ff; margin: 0; font-weight: bold; font-family: monospace;">${referralData.referralCode}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Commission Amount:</p>
                  <p style="color: #00f0ff; margin: 0; font-weight: bold; font-size: 18px;">₦${referralData.commissionAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Status:</p>
                  <p style="color: #ffcc00; margin: 0; font-weight: bold;">Pending (7-day holding period)</p>
                </div>
              </div>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #00f0ff; margin-top: 0;">Next Steps</h3>
              <ul style="color: #b9cacb; margin: 10px 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Commission will be available for withdrawal after 7 days</li>
                <li style="margin-bottom: 10px;">Track your earnings in your partner dashboard</li>
                <li style="margin-bottom: 10px;">Keep sharing your referral link to earn more!</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #b9cacb; font-size: 12px;">
                Keep up the great work!
              </p>
              <p style="color: #b9cacb; font-size: 12px; margin-top: 10px;">
                Best regards,<br>AutoLearn Spot Team
              </p>
            </div>
          </div>
        `,
      };

      await getTransporter().sendMail(mailOptions);
      console.log('[AdminEmailService] Partner referral email sent successfully');
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending partner referral email:', error);
      return false;
    }
  }
}