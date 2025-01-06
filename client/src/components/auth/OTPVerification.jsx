import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const OTPVerification = ({ userId, onSuccess }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
    const navigate = useNavigate();

    // Handle countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    // Format time remaining
    const formatTimeRemaining = () => {
        const minutes = Math.floor(countdown / 60);
        const seconds = countdown % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Handle input change
    const handleChange = (index, value) => {
        if (value.length > 1) return; // Prevent multiple digits
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`);
            if (nextInput) nextInput.focus();
        }
    };

    // Handle key press for backspace
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`);
            if (prevInput) {
                prevInput.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/verify-otp', {
                userId,
                otp: otpString
            });

            if (response.data.accessToken) {
                onSuccess?.(response.data);
                navigate('/dashboard');
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            setIsLoading(true);
            await api.post('/auth/resend-otp', { userId });
            setCountdown(300); // Reset countdown
            setOtp(['', '', '', '', '', '']); // Clear OTP fields
            setError('');
        } catch (error) {
            setError('Failed to resend code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Verify Your Identity
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter the 6-digit code sent to your email
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="flex justify-center space-x-2">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                name={`otp-${index}`}
                                maxLength="1"
                                className="w-12 h-12 text-center text-2xl border-2 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                pattern="[0-9]"
                                inputMode="numeric"
                                autoComplete="off"
                                required
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="text-red-500 text-center text-sm">
                            {error}
                        </div>
                    )}

                    <div className="text-center text-sm text-gray-600">
                        Time remaining: {formatTimeRemaining()}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || countdown === 0}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={isLoading || countdown > 0}
                            className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
                        >
                            Resend Code
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OTPVerification; 