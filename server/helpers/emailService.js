const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like 'SendGrid', 'Mailgun', etc.
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Use environment variables in production
    pass: process.env.EMAIL_PASS || 'your-app-password' // Use app password for Gmail
  }
});

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send team invitation email
 * @param {string} to - Recipient email address
 * @param {string} teamName - Name of the team
 * @param {string} inviterName - Name of the person who sent the invitation
 * @param {string} customMessage - Custom message from the inviter
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendTeamInvitation = async (to, teamName, inviterName, customMessage) => {
  const subject = `Invitation to join ${teamName} team`;
  
  const text = `
    Hello,
    
    ${inviterName} has invited you to join the ${teamName} team on the Vote System platform.
    
    Message from ${inviterName}:
    "${customMessage}"
    
    Please log in to your account to accept or decline this invitation.
    
    Best regards,
    Vote System Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Team Invitation</h2>
      <p>Hello,</p>
      <p><strong>${inviterName}</strong> has invited you to join the <strong>${teamName}</strong> team on the Vote System platform.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <p style="margin: 0;"><em>"${customMessage}"</em></p>
        <p style="margin: 5px 0 0; text-align: right;">- ${inviterName}</p>
      </div>
      
      <p>Please log in to your account to accept or decline this invitation.</p>
      
      <p>Best regards,<br>Vote System Team</p>
    </div>
  `;
  
  return sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendTeamInvitation
}; 