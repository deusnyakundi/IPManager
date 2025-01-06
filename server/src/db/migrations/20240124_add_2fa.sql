-- Add 2FA columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create OTP table
CREATE TABLE IF NOT EXISTS user_otps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_method VARCHAR(10) DEFAULT 'email',
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
); 