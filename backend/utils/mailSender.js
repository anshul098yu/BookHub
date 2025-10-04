const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const mailSender = async (email, title, body) => {
  try {
    // Check if email configuration is available
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.log("Email configuration missing. Skipping email send.");
      return { skipped: true, reason: "Email configuration missing" };
    }

    //Create Transporter
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    //Send mail
    let info = await transporter.sendMail({
      from: `"BookHub" <${process.env.MAIL_USER}>`,
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log("Email sent successfully to:", email);
    return info;
  } catch (error) {
    console.log("Email sending failed:", error.message);
    // Don't throw error to prevent breaking registration
    return { error: error.message };
  }
};

module.exports = mailSender;
