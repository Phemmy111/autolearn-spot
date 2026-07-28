import { scholarshipConfig } from '@/config/scholarship';
import { sendEmail } from '@/utils/email';

interface EmailData {
  to: string;
  fullName: string;
  referenceNumber: string;
}

// Email 1: Application Received (Already implemented in actions.ts, keeping for reference)
export async function sendApplicationReceivedEmail({ to, fullName, referenceNumber }: EmailData) {
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0e12; color: #e2e2e8;">
      <div style="background: linear-gradient(135deg, #111 0%, #1a1c20 100%); padding: 30px; border-bottom: 2px solid #00f0ff;">
        <h1 style="color: #00f0ff; margin: 0; font-size: 24px;">AutoLearn Spot</h1>
        <p style="color: #b9cacb; margin: 5px 0 0 0; font-size: 14px;">AI Automation Scholarship Programme</p>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #00f0ff; margin: 0 0 20px 0; font-size: 22px;">Application Received</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">We have successfully received your application for the AutoLearn Spot AI Automation Scholarship Programme.</p>
        
        <div style="background: #1a1c20; border-left: 4px solid #00f0ff; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #b9cacb;"><strong>Reference Number:</strong> ${referenceNumber}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">Application reviews take approximately 3 days. Please monitor your email for updates regarding your application status.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Join our WhatsApp community to stay updated on the programme:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${scholarshipConfig.generalWhatsAppGroup}" style="display: inline-block; background: #25D366; color: white; padding: 15px 30px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px; text-transform: uppercase;">Join WhatsApp Group</a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">Thank you for your interest in our programme.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Best regards,<br/>The AutoLearn Spot Team</p>
      </div>
      
      <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #1f2229;">
        <p style="margin: 0; color: #b9cacb; font-size: 12px;">© 2026 AutoLearn Spot. All rights reserved.</p>
        <p style="margin: 10px 0 0 0; color: #5d5f63; font-size: 12px;">
          <a href="https://autolearn-spot.vercel.app" style="color: #00f0ff; text-decoration: none;">autolearn-spot.vercel.app</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: `Application Received: ${referenceNumber}`,
    html: emailHtml,
  });
}

// Email 2: Under Review
export async function sendUnderReviewEmail({ to, fullName, referenceNumber }: EmailData) {
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0e12; color: #e2e2e8;">
      <div style="background: linear-gradient(135deg, #111 0%, #1a1c20 100%); padding: 30px; border-bottom: 2px solid #00f0ff;">
        <h1 style="color: #00f0ff; margin: 0; font-size: 24px;">AutoLearn Spot</h1>
        <p style="color: #b9cacb; margin: 5px 0 0 0; font-size: 14px;">AI Automation Scholarship Programme</p>
      </div>
      
      <div style="padding: 30px;">
        <p style="font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">We are pleased to inform you that your scholarship application is now under review.</p>
        
        <div style="background: #1a1c20; border-left: 4px solid #00f0ff; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #b9cacb;"><strong>Reference Number:</strong> ${referenceNumber}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">Our team is carefully evaluating all applications. You will hear from us soon regarding the status of your application.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Thank you for your patience and interest in joining our programme.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Best regards,<br/>The AutoLearn Spot Team</p>
      </div>
      
      <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #1f2229;">
        <p style="margin: 0; color: #b9cacb; font-size: 12px;">© 2026 AutoLearn Spot. All rights reserved.</p>
        <p style="margin: 10px 0 0 0; color: #5d5f63; font-size: 12px;">
          <a href="https://autolearn-spot.vercel.app" style="color: #00f0ff; text-decoration: none;">autolearn-spot.vercel.app</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'Your Scholarship Application is Under Review',
    html: emailHtml,
  });
}

// Email 3: Shortlisted
export async function sendShortlistedEmail({ to, fullName, referenceNumber }: EmailData) {
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0e12; color: #e2e2e8;">
      <div style="background: linear-gradient(135deg, #111 0%, #1a1c20 100%); padding: 30px; border-bottom: 2px solid #00f0ff;">
        <h1 style="color: #00f0ff; margin: 0; font-size: 24px;">AutoLearn Spot</h1>
        <p style="color: #b9cacb; margin: 5px 0 0 0; font-size: 14px;">AI Automation Scholarship Programme</p>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #00f0ff; margin: 0 0 20px 0; font-size: 22px;">Congratulations! You've Been Shortlisted</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">We are thrilled to inform you that you have successfully passed the first stage of our scholarship selection process and have been shortlisted!</p>
        
        <div style="background: #1a1c20; border-left: 4px solid #00f0ff; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #b9cacb;"><strong>Reference Number:</strong> ${referenceNumber}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">Final selection is currently underway. Our team is carefully reviewing all shortlisted candidates to determine the final scholarship recipients.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">You will receive a notification regarding the final decision soon.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Best regards,<br/>The AutoLearn Spot Team</p>
      </div>
      
      <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #1f2229;">
        <p style="margin: 0; color: #b9cacb; font-size: 12px;">© 2026 AutoLearn Spot. All rights reserved.</p>
        <p style="margin: 10px 0 0 0; color: #5d5f63; font-size: 12px;">
          <a href="https://autolearn-spot.vercel.app" style="color: #00f0ff; text-decoration: none;">autolearn-spot.vercel.app</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'Congratulations! You\'ve Been Shortlisted',
    html: emailHtml,
  });
}

// Email 4: Accepted with Payment Button
export async function sendAcceptedEmail({ to, fullName, referenceNumber }: EmailData) {
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0e12; color: #e2e2e8;">
      <div style="background: linear-gradient(135deg, #111 0%, #1a1c20 100%); padding: 30px; border-bottom: 2px solid #00f0ff;">
        <h1 style="color: #00f0ff; margin: 0; font-size: 24px;">AutoLearn Spot</h1>
        <p style="color: #b9cacb; margin: 5px 0 0 0; font-size: 14px;">AI Automation Scholarship Programme</p>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #00f0ff; margin: 0 0 20px 0; font-size: 22px;">Congratulations! You Have Been Awarded an AutoLearn Spot Scholarship</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">We are delighted to inform you that you have been selected for the AutoLearn Spot AI Automation Scholarship Programme!</p>
        
        <div style="background: #1a1c20; border-left: 4px solid #00f0ff; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #b9cacb;"><strong>Reference Number:</strong> ${referenceNumber}</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #1a1c20 0%, #0c0e12 100%); padding: 25px; margin: 25px 0; border: 1px solid #00f0ff; border-radius: 8px;">
          <h3 style="color: #00f0ff; margin: 0 0 15px 0; font-size: 18px;">Scholarship Award Details</h3>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0; font-size: 14px; color: #b9cacb;">Original Course Value:</p>
            <p style="margin: 0; font-size: 24px; color: #e2e2e8; font-weight: bold;">₦${scholarshipConfig.fullValue.toLocaleString()}</p>
          </div>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0; font-size: 14px; color: #b9cacb;">Scholarship Awarded - You Pay Only:</p>
            <p style="margin: 0; font-size: 28px; color: #00f0ff; font-weight: bold;">₦${scholarshipConfig.commitmentFee.toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #b9cacb;">Commitment Fee</p>
          </div>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">The commitment fee secures your slot and confirms your serious participation in the programme.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${scholarshipConfig.paymentUrl}" style="display: inline-block; background: #00f0ff; color: #00363a; padding: 15px 40px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px; text-transform: uppercase;">Pay Commitment Fee</a>
        </div>
        
        <div style="background: #1a1c20; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 12px; color: #b9cacb; text-align: center;">Payment Link: <a href="${scholarshipConfig.paymentUrl}" style="color: #00f0ff;">${scholarshipConfig.paymentUrl}</a></p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">After payment, you will receive access within review.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Best regards,<br/>The AutoLearn Spot Team</p>
      </div>
      
      <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #1f2229;">
        <p style="margin: 0; color: #b9cacb; font-size: 12px;">© 2026 AutoLearn Spot. All rights reserved.</p>
        <p style="margin: 10px 0 0 0; color: #5d5f63; font-size: 12px;">
          <a href="https://autolearn-spot.vercel.app" style="color: #00f0ff; text-decoration: none;">autolearn-spot.vercel.app</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'Congratulations! You Have Been Awarded an AutoLearn Spot Scholarship',
    html: emailHtml,
  });
}

// Email 5: Waitlisted
export async function sendWaitlistedEmail({ to, fullName, referenceNumber }: EmailData) {
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0e12; color: #e2e2e8;">
      <div style="background: linear-gradient(135deg, #111 0%, #1a1c20 100%); padding: 30px; border-bottom: 2px solid #00f0ff;">
        <h1 style="color: #00f0ff; margin: 0; font-size: 24px;">AutoLearn Spot</h1>
        <p style="color: #b9cacb; margin: 5px 0 0 0; font-size: 14px;">AI Automation Scholarship Programme</p>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #00f0ff; margin: 0 0 20px 0; font-size: 22px;">You Have Been Placed on Our Waitlist</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Thank you for your interest in the AutoLearn Spot Scholarship Programme. We are pleased to inform you that you have been placed on our waitlist.</p>
        
        <div style="background: #1a1c20; border-left: 4px solid #00f0ff; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #b9cacb;"><strong>Reference Number:</strong> ${referenceNumber}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">You are still under consideration. If scholarship slots become available, we will contact you immediately.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">We appreciate your patience and understanding.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Best regards,<br/>The AutoLearn Spot Team</p>
      </div>
      
      <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #1f2229;">
        <p style="margin: 0; color: #b9cacb; font-size: 12px;">© 2026 AutoLearn Spot. All rights reserved.</p>
        <p style="margin: 10px 0 0 0; color: #5d5f63; font-size: 12px;">
          <a href="https://autolearn-spot.vercel.app" style="color: #00f0ff; text-decoration: none;">autolearn-spot.vercel.app</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'You Have Been Placed on Our Waitlist',
    html: emailHtml,
  });
}

// Email 6: Not Selected
export async function sendNotSelectedEmail({ to, fullName, referenceNumber }: EmailData) {
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0e12; color: #e2e2e8;">
      <div style="background: linear-gradient(135deg, #111 0%, #1a1c20 100%); padding: 30px; border-bottom: 2px solid #00f0ff;">
        <h1 style="color: #00f0ff; margin: 0; font-size: 24px;">AutoLearn Spot</h1>
        <p style="color: #b9cacb; margin: 5px 0 0 0; font-size: 14px;">AI Automation Scholarship Programme</p>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #e2e2e8; margin: 0 0 20px 0; font-size: 22px;">Scholarship Application Update</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Thank you for your interest in the AutoLearn Spot Scholarship Programme. After careful consideration, we regret to inform you that you were not selected for this scholarship cohort.</p>
        
        <div style="background: #1a1c20; border-left: 4px solid #5d5f63; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #b9cacb;"><strong>Reference Number:</strong> ${referenceNumber}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">We encourage you to apply again in future scholarship cycles. Your interest in learning AI automation is commendable, and we hope to see you in our programme soon.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">If you would still like to join our programme, you can enroll normally at our regular course rate.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://autolearn-spot.vercel.app" style="display: inline-block; background: #00f0ff; color: #00363a; padding: 15px 40px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px; text-transform: uppercase;">Visit AutoLearn Spot</a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">We wish you the best in your learning journey.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Best regards,<br/>The AutoLearn Spot Team</p>
      </div>
      
      <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #1f2229;">
        <p style="margin: 0; color: #b9cacb; font-size: 12px;">© 2026 AutoLearn Spot. All rights reserved.</p>
        <p style="margin: 10px 0 0 0; color: #5d5f63; font-size: 12px;">
          <a href="https://autolearn-spot.vercel.app" style="color: #00f0ff; text-decoration: none;">autolearn-spot.vercel.app</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'Scholarship Application Update',
    html: emailHtml,
  });
}

// Email 7: Welcome after Payment Verification
export async function sendWelcomeEmail({ to, fullName, referenceNumber }: EmailData) {
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0e12; color: #e2e2e8;">
      <div style="background: linear-gradient(135deg, #111 0%, #1a1c20 100%); padding: 30px; border-bottom: 2px solid #00f0ff;">
        <h1 style="color: #00f0ff; margin: 0; font-size: 24px;">AutoLearn Spot</h1>
        <p style="color: #b9cacb; margin: 5px 0 0 0; font-size: 14px;">AI Automation Scholarship Programme</p>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #00f0ff; margin: 0 0 20px 0; font-size: 22px;">Welcome to AutoLearn Spot!</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Congratulations! Your payment has been verified and you are now officially enrolled in the AutoLearn Spot AI Automation Scholarship Programme.</p>
        
        <div style="background: #1a1c20; border-left: 4px solid #00f0ff; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #b9cacb;"><strong>Reference Number:</strong> ${referenceNumber}</p>
        </div>
        
        <h3 style="color: #00f0ff; margin: 25px 0 15px 0; font-size: 18px;">Next Steps</h3>
        
        <ul style="font-size: 16px; line-height: 1.8; color: #b9cacb;">
          <li>Complete your profile setup in the student dashboard</li>
          <li>Review the orientation materials</li>
          <li>Join our WhatsApp community for cohort updates</li>
          <li>Prepare for the upcoming live classes</li>
        </ul>
        
        <h3 style="color: #00f0ff; margin: 25px 0 15px 0; font-size: 18px;">Important Information</h3>
        
        <p style="font-size: 16px; line-height: 1.6;"><strong>Dashboard Access:</strong> You can access your learning materials and progress through the student dashboard.</p>
        <p style="font-size: 16px; line-height: 1.6;"><strong>Support:</strong> For any questions, contact us at support@autolearnspot.com</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${scholarshipConfig.paidWhatsAppGroup}" style="display: inline-block; background: #25D366; color: white; padding: 15px 30px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px; text-transform: uppercase;">Join Paid Students WhatsApp Group</a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;"><strong>Live Classes:</strong> Details about upcoming live sessions will be posted in the dashboard and WhatsApp group</p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-top: 25px;">We are excited to have you join us and look forward to seeing you succeed in your AI automation journey!</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Best regards,<br/>The AutoLearn Spot Team</p>
      </div>
      
      <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #1f2229;">
        <p style="margin: 0; color: #b9cacb; font-size: 12px;">© 2026 AutoLearn Spot. All rights reserved.</p>
        <p style="margin: 10px 0 0 0; color: #5d5f63; font-size: 12px;">
          <a href="https://autolearn-spot.vercel.app" style="color: #00f0ff; text-decoration: none;">autolearn-spot.vercel.app</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'Welcome to AutoLearn Spot',
    html: emailHtml,
  });
}
