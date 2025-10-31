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
            <p style="color:#5a6270;margin-top:18px;font-size:.98rem">If you’re not expecting this, you can ignore this email.</p>
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

module.exports = { sendWelcomeEmail };
