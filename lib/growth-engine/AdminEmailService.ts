import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const ADMIN_EMAIL = 'femiadeleke2020@gmail.com';

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
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
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

      await transporter.sendMail(mailOptions);
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
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
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

      await transporter.sendMail(mailOptions);
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
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
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

      await transporter.sendMail(mailOptions);
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
    referralCode: string;
    tempPassword: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
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
                Congratulations! You have been successfully added to the AutoLearn Spot Partner Program. Your account is now active and ready to start earning commissions.
              </p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #00f0ff; margin-top: 0;">Your Account Details</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
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
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #00f0ff; margin-top: 0;">Getting Started</h3>
              <ul style="color: #b9cacb; margin: 10px 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Login to your partner dashboard at <a href="https://autolearn-spot.vercel.app/partners/login" style="color: #00f0ff;">autolearn-spot.vercel.app/partners/login</a></li>
                <li style="margin-bottom: 10px;">Access your marketing materials and referral link</li>
                <li style="margin-bottom: 10px;">Start sharing your referral code to earn ₦1,500 per successful enrollment</li>
                <li style="margin-bottom: 10px;">Track your performance and earnings in real-time</li>
              </ul>
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

      await transporter.sendMail(mailOptions);
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
    applicantPhone: string;
    partnerType: string;
    motivation: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
        to: ADMIN_EMAIL,
        subject: '📝 New Partnership Application - AutoLearn Spot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0e12; color: #e2e2e8;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00f0ff; margin: 0;">AutoLearn Spot</h1>
              <p style="color: #b9cacb; margin: 5px 0;">New Partnership Application</p>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #00f0ff; margin-top: 0;">Application Details</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Applicant Name:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${applicationData.applicantName}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Email:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${applicationData.applicantEmail}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Phone:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${applicationData.applicantPhone}</p>
                </div>
                <div>
                  <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Partner Type:</p>
                  <p style="color: #e2e2e8; margin: 0; font-weight: bold;">${applicationData.partnerType}</p>
                </div>
              </div>
              
              <div style="margin-top: 20px;">
                <p style="color: #b9cacb; margin: 5px 0; font-size: 14px;">Motivation:</p>
                <p style="color: #e2e2e8; margin: 0; font-style: italic;">"${applicationData.motivation}"</p>
              </div>
            </div>
            
            <div style="background-color: #111317; border: 1px solid #1f2229; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #ffcc00; margin: 0; font-size: 16px; font-weight: bold; text-align: center;">
                ⏳ PENDING REVIEW
              </p>
              <p style="color: #b9cacb; margin: 10px 0 0 0; font-size: 14px; text-align: center;">
                Please review this application in the admin dashboard.
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

      await transporter.sendMail(mailOptions);
      console.log('[AdminEmailService] Partner application email sent successfully');
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending partner application email:', error);
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
        from: process.env.SMTP_FROM || 'noreply@autolearnspot.com',
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

      await transporter.sendMail(mailOptions);
      console.log('[AdminEmailService] Partner referral email sent successfully');
      return true;
    } catch (error) {
      console.error('[AdminEmailService] Error sending partner referral email:', error);
      return false;
    }
  }
}