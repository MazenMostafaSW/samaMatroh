const nodemailer = require('nodemailer');

const sendEmail = async (options) => {

        // Create a reusable transporter object using Brevo SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        
        // Log email configuration (without sensitive data)
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Support Team'}" <${process.env.EMAIL_FROM_ADDRESS || 'from@example.com'}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };
        
        // Send email
        await transporter.sendMail(mailOptions);

};

module.exports = sendEmail;
