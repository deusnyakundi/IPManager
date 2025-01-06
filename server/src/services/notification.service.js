const nodemailer = require('nodemailer');

// Create email transporter
const emailTransporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send OTP via email
exports.sendOTP = async (user, otp) => {
    try {
        await emailTransporter.sendMail({
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: 'Your Authentication Code',
            html: `
                <h2>Authentication Required</h2>
                <p>Your one-time password is:</p>
                <h1 style="color: #4A90E2; font-size: 32px;">${otp}</h1>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
            `
        });
        
        return { success: true };
    } catch (error) {
        console.error('Failed to send OTP:', error);
        throw new Error('Failed to send authentication code');
    }
}; 