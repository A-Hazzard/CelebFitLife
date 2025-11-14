import 'server-only';
import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('Email transporter not available. Skipping email send.');
      return false;
    }

    const mailOptions = {
      from: `CelebFitLife <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

export function generateWelcomeEmail(customerEmail: string): EmailOptions {
  return {
    to: customerEmail,
    subject: 'Welcome to CelebFitLife! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background-color: #f5f5f5;
              padding: 40px 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
              color: #ffffff;
              padding: 48px 40px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: 700;
              color: #ffffff;
              margin-bottom: 16px;
              letter-spacing: -1px;
            }
            .logo span {
              color: #FF7F30;
            }
            .header-subtitle {
              font-size: 16px;
              color: #cccccc;
              margin-top: 8px;
            }
            .content {
              padding: 40px;
            }
            .greeting {
              font-size: 18px;
              color: #1a1a1a;
              margin-bottom: 24px;
              font-weight: 500;
            }
            .main-text {
              font-size: 16px;
              color: #4a4a4a;
              margin-bottom: 32px;
              line-height: 1.7;
            }
            .highlight {
              color: #FF7F30;
              font-weight: 600;
            }
            .steps-container {
              background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%);
              border: 1px solid #e5e5e5;
              border-radius: 12px;
              padding: 32px;
              margin: 32px 0;
            }
            .steps-title {
              font-size: 20px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 24px;
              text-align: center;
            }
            .step {
              display: flex;
              align-items: flex-start;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e5e5e5;
            }
            .step:last-child {
              margin-bottom: 0;
              padding-bottom: 0;
              border-bottom: none;
            }
            .step-number {
              color: #FF7F30;
              font-weight: 700;
              font-size: 20px;
              line-height: 1;
              flex-shrink: 0;
              margin-right: 16px;
              padding-top: 2px;
            }
            @media (max-width: 480px) {
              .step-number {
                font-size: 18px;
                margin-right: 12px;
              }
            }
            .step-content {
              flex: 1;
            }
            .step-title {
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 4px;
              font-size: 16px;
            }
            .step-description {
              color: #666;
              font-size: 15px;
              line-height: 1.6;
            }
            .cta-container {
              text-align: center;
              margin: 40px 0;
            }
            .cta-button {
              display: inline-block;
              background-color: #ffffff;
              color: #000000;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
              border: 2px solid #000000;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .cta-button:hover {
              background-color: #FF7F30;
              color: #ffffff;
              border-color: #FF7F30;
              transform: translateY(-2px);
              box-shadow: 0 6px 12px rgba(255, 127, 48, 0.3);
            }
            @media (max-width: 480px) {
              .cta-button {
                padding: 14px 32px;
                font-size: 15px;
                display: block;
                width: 100%;
                max-width: 280px;
                margin: 0 auto;
              }
            }
            .closing {
              font-size: 16px;
              color: #4a4a4a;
              margin-top: 32px;
              line-height: 1.7;
            }
            .signature {
              margin-top: 24px;
              font-size: 16px;
              color: #1a1a1a;
            }
            .signature strong {
              color: #000;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 32px 40px;
              text-align: center;
              border-top: 1px solid #e5e5e5;
            }
            .footer-text {
              font-size: 13px;
              color: #999;
              line-height: 1.6;
            }
            .footer-link {
              color: #FF7F30;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">Celeb<span>Fit</span>Life</div>
              <div class="header-subtitle">Train with Your Idol. Live.</div>
            </div>
            
            <div class="content">
              <div class="greeting">Hi there! 👋</div>
              
              <div class="main-text">
                Thank you for joining <span class="highlight">CelebFitLife</span>! Your payment has been confirmed, and you're now part of an exclusive community of fitness enthusiasts.
              </div>
              
              <div class="steps-container">
                <div class="steps-title">What happens next?</div>
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <div class="step-title">Exclusive Notifications</div>
                    <div class="step-description">You'll receive early access notifications about upcoming live sessions with celebrity trainers.</div>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <div class="step-title">First Access</div>
                    <div class="step-description">Get priority booking for sessions with your favorite athletes and fitness influencers.</div>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <div class="step-title">Join the Community</div>
                    <div class="step-description">Connect with like-minded fitness enthusiasts and share your journey.</div>
                  </div>
                </div>
              </div>
              
              <div class="main-text">
                Our first live sessions are dropping soon. Stay tuned for exclusive updates!
              </div>
              
              <div class="cta-container">
                <a href="https://celebfitlife.vercel.app" class="cta-button">
                  Visit CelebFitLife
                </a>
              </div>
              
              <div class="signature">
                Let's transform your fitness journey together!<br><br>
                Best regards,<br>
                <strong>The CelebFitLife Team</strong>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                <p>© ${new Date().getFullYear()} CelebFitLife. All rights reserved.</p>
                <p style="margin-top: 8px;">You're receiving this email because you joined our waitlist.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to CelebFitLife! 🎉

Hi there!

Thank you for joining CelebFitLife! Your payment has been confirmed, and you're now part of an exclusive community of fitness enthusiasts.

What happens next?

1. Exclusive Notifications - You'll receive early access notifications about upcoming live sessions with celebrity trainers.
2. First Access - Get priority booking for sessions with your favorite athletes and fitness influencers.
3. Join the Community - Connect with like-minded fitness enthusiasts and share your journey.

Our first live sessions are dropping soon. Stay tuned for exclusive updates!

Visit us at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://celebfitlife.com'}

If you have any questions, feel free to reach out to us at support@celebfitlife.com.

Let's transform your fitness journey together!

Best regards,
The CelebFitLife Team

© ${new Date().getFullYear()} CelebFitLife. All rights reserved.
You're receiving this email because you joined our waitlist.
    `,
  };
}

