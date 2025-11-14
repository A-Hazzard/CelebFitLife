import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { rateLimit, getClientIdentifier } from '../lib/rateLimit';

export async function POST(request: Request) {
  try {
    // Rate limiting - 3 requests per 10 minutes per IP
    const clientId = getClientIdentifier(request);
    const limit = rateLimit(clientId, 3, 10 * 60 * 1000);
    
    if (!limit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((limit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': limit.remaining.toString(),
          }
        }
      );
    }

    const { email, subject, message } = await request.json();

    // Validation
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    let sanitizedSubject = subject.trim().substring(0, 200); // Limit subject length
    sanitizedSubject = sanitizedSubject
      .replace(/\btest\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!sanitizedSubject) {
      sanitizedSubject = 'Support request';
    }
    const sanitizedMessage = message.trim().substring(0, 5000); // Limit message length

    // Check if Gmail is configured
    const GMAIL_USER = process.env.GMAIL_USER;
    if (!GMAIL_USER) {
      console.error('Gmail not configured for contact form');
      return NextResponse.json(
        { error: "Contact form is not available at this time" },
        { status: 503 }
      );
    }

    // Send email to support
    const emailSent = await sendEmail({
      to: GMAIL_USER, // Send to your support email
      subject: `[Support Request] ${sanitizedSubject}`,
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
                padding: 32px 40px;
                text-align: center;
              }
              .header h1 {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
              }
              .header .badge {
                display: inline-block;
                background-color: #FF7F30;
                color: #000;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 8px;
              }
              .content {
                padding: 40px;
              }
              .info-card {
                background-color: #f9f9f9;
                border-left: 4px solid #FF7F30;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 24px;
              }
              .info-row {
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #e5e5e5;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                font-size: 12px;
                font-weight: 600;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                min-width: 80px;
                margin-right: 16px;
              }
              .info-value {
                font-size: 15px;
                color: #1a1a1a;
                flex: 1;
                word-break: break-word;
              }
              .info-value.email {
                color: #FF7F30;
                font-weight: 500;
              }
              .message-content {
                background-color: #ffffff;
                border: 1px solid #e5e5e5;
                border-radius: 8px;
                padding: 20px;
                margin-top: 8px;
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 15px;
                line-height: 1.7;
                color: #333;
              }
              .footer {
                background-color: #f9f9f9;
                padding: 24px 40px;
                text-align: center;
                border-top: 1px solid #e5e5e5;
                font-size: 13px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>New Support Request</h1>
                <div class="badge">Action Required</div>
              </div>
              <div class="content">
                <div class="info-card">
                  <div class="info-row">
                    <div class="info-label">From</div>
                    <div class="info-value email">${sanitizedEmail}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Subject</div>
                    <div class="info-value">${sanitizedSubject}</div>
                  </div>
                </div>
                <div>
                  <div class="info-label" style="margin-bottom: 8px;">Message</div>
                  <div class="message-content">${sanitizedMessage.replace(/\n/g, '<br>')}</div>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated message from CelebFitLife Support System</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
New Support Request

From: ${sanitizedEmail}
Subject: ${sanitizedSubject}

Message:
${sanitizedMessage}
      `,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    await sendEmail({
      to: sanitizedEmail,
      subject: 'We received your message - CelebFitLife Support',
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
                margin-bottom: 24px;
                line-height: 1.7;
              }
              .highlight {
                color: #FF7F30;
                font-weight: 600;
              }
              .message-box {
                background-color: #f9f9f9;
                border-left: 4px solid #FF7F30;
                border-radius: 8px;
                padding: 20px;
                margin: 24px 0;
              }
              .message-subject {
                font-weight: 600;
                color: #1a1a1a;
                margin-bottom: 12px;
                font-size: 15px;
              }
              .message-text {
                color: #4a4a4a;
                font-size: 15px;
                line-height: 1.7;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .response-time {
                background-color: #f0f9ff;
                border: 1px solid #bae6fd;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
                text-align: center;
              }
              .response-time-text {
                font-size: 14px;
                color: #0369a1;
                font-weight: 500;
              }
              .signature {
                margin-top: 32px;
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
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <div class="logo">Celeb<span>Fit</span>Life</div>
              </div>
              
              <div class="content">
                <div class="greeting">Hi there! 👋</div>
                
                <div class="main-text">
                  Thank you for contacting <span class="highlight">CelebFitLife</span> support. We've received your message and our team will get back to you as soon as possible.
                </div>
                
                <div class="message-box">
                  <div class="message-subject">Your Message:</div>
                  <div style="font-size: 13px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Subject: ${sanitizedSubject}</div>
                  <div class="message-text">${sanitizedMessage.replace(/\n/g, '<br>')}</div>
                </div>
                
                <div class="response-time">
                  <div class="response-time-text">⏱️ We typically respond within 24-48 hours</div>
                </div>
                
                <div class="main-text">
                  If your issue is urgent, please don't hesitate to reach out again.
                </div>
                
                <div class="signature">
                  Best regards,<br>
                  <strong>The CelebFitLife Support Team</strong>
                </div>
              </div>
              
              <div class="footer">
                <div class="footer-text">
                  <p>© ${new Date().getFullYear()} CelebFitLife. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
We received your message!

Hi there,

Thank you for contacting CelebFitLife support. We've received your message and our team will get back to you as soon as possible.

Your message:
Subject: ${sanitizedSubject}

${sanitizedMessage}

We typically respond within 24-48 hours. If your issue is urgent, please don't hesitate to reach out again.

Best regards,
The CelebFitLife Support Team
      `,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Message sent successfully" 
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Contact form error:', errorMessage);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

