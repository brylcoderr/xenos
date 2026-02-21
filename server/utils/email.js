const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendEmail = async ({ to, subject, html }) => {
  if (!resend) {
    console.log('--- MOCK EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('------------------');
    return { id: 'mock_id' };
  }

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

const sendOnboardingEmail = async (client) => {
  return sendEmail({
    to: client.email,
    subject: `Welcome to the Agency OS, ${client.name}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #9b7cff;">Welcome to Xenotrix Agency!</h1>
        <p>Hi ${client.name},</p>
        <p>We've officially started your onboarding process. You can now access your dedicated project portal to track our progress, view documents, and pay invoices.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" 
             style="background: #9b7cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Login to Your Portal
          </a>
        </div>
        <p>If you have any questions, just reply to this email.</p>
        <p>Best regards,<br>The Xenotrix Team</p>
      </div>
    `
  });
};

module.exports = { sendEmail, sendOnboardingEmail };
