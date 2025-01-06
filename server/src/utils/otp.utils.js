const crypto = require('crypto');
const bcrypt = require('bcrypt');

const OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.hashOTP = async (otp) => {
    return await bcrypt.hash(otp, 10);
};

exports.isOTPExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
}; 