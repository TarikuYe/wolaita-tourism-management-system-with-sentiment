const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // your Gmail app password
  },
});

function sendWelcomeEmail({ to, name, resetLink, role }) {
  const orgLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/368px-Google_2015_logo.svg.png'; // Change to your project logo if desired
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Welcome to Project212! Set Your Password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; padding: 0; margin:0;">
        <div style="max-width: 500px; margin: 32px auto; background: #fff; border-radius: 8px; box-shadow:0 1px 2px rgba(60,72,88,.07); overflow:hidden;">
          <div style="padding: 32px 32px 24px; text-align:center; background:#23272f;">
            <img src="${orgLogo}" alt="Project212" style="max-width:140px; margin-bottom: 8px; border-radius: 8px;">
            <h1 style="color:white; margin: 0; font-size: 1.7rem;">Welcome${name ? `, ${name}` : ''}!</h1>
            <p style="margin:8px 0 0;color:#e2e8f0;font-size:.97rem;">Your ${role || 'new'} account is ready</p>
          </div>
          <div style="padding:24px 32px 16px 32px;">
            <p style="font-size:1.08rem; color:#23272f;">Your administrator has created an account for you. To begin, please set your password by clicking the button below:</p>
            <a href="${resetLink}" style="display:inline-block;margin:24px 0px;padding:12px 32px; background:#f59e42; color:#fff; border-radius:5px; font-weight:600; text-decoration:none; letter-spacing:.02em;">Set Your Password</a>
            <p style="color:#5a6270;margin-top:18px;font-size:.98rem">If you're not expecting this, you can ignore this email.</p>
          </div>
          <div style="background:#f6f8fa;padding:16px 32px;text-align:center;opacity:.76;font-size:.92rem;color:#888">
            &copy; 2024 Project212 &mdash; Account setup and travel management platform
          </div>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

function sendContactEmail({ name, email, message }) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    replyTo: email,
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="padding: 24px 32px; background: #f59e42; color: white;">
            <h1 style="margin: 0; font-size: 1.5rem;">New Contact Form Submission</h1>
          </div>
          <div style="padding: 24px 32px;">
            <div style="margin-bottom: 20px;">
              <h3 style="color: #23272f; margin: 0 0 8px 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">From:</h3>
              <p style="margin: 0; color: #23272f; font-size: 1rem; font-weight: 600;">${name}</p>
            </div>
            <div style="margin-bottom: 20px;">
              <h3 style="color: #23272f; margin: 0 0 8px 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Email:</h3>
              <p style="margin: 0; color: #23272f; font-size: 1rem;">
                <a href="mailto:${email}" style="color: #f59e42; text-decoration: none;">${email}</a>
              </p>
            </div>
            <div style="margin-bottom: 20px;">
              <h3 style="color: #23272f; margin: 0 0 8px 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Message:</h3>
              <div style="background: #f6f8fa; padding: 16px; border-radius: 4px; border-left: 4px solid #f59e42;">
                <p style="margin: 0; color: #23272f; font-size: 1rem; white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>
            </div>
          </div>
          <div style="background: #f6f8fa; padding: 16px 32px; text-align: center; font-size: 0.875rem; color: #666;">
            <p style="margin: 0;">This email was sent from the Wolaita Tours contact form.</p>
            <p style="margin: 8px 0 0 0;">You can reply directly to this email to respond to ${name}.</p>
          </div>
        </div>
      </div>
    `,
    text: `
New Contact Form Submission

From: ${name}
Email: ${email}

Message:
${message}

---
This email was sent from the Wolaita Tours contact form.
You can reply directly to this email to respond to ${name}.
    `.trim(),
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendWelcomeEmail, sendContactEmail };
