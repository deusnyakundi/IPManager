import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Box, Typography, Alert } from '@mui/material';

const TwoFactorConfig = ({ userId }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch current 2FA status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await api.get(`/users/${userId}`);
                setIsEnabled(response.data.two_factor_enabled);
                setEmail(response.data.email || '');
                setIsLoading(false);
            } catch (error) {
                setError('Failed to load 2FA settings');
                setIsLoading(false);
            }
        };

        fetchStatus();
    }, [userId]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 'md', mx: 'auto', p: 3 }}>
            <Typography variant="h5" gutterBottom>Two-Factor Authentication Status</Typography>

            <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                    Status: <strong>{isEnabled ? 'Enabled' : 'Disabled'}</strong>
                </Typography>
                {isEnabled && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Verification codes will be sent to: {email}
                    </Typography>
                )}
                {!isEnabled && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Contact your administrator to enable Two-Factor Authentication for your account.
                    </Alert>
                )}
            </Box>
        </Box>
    );
};

export default TwoFactorConfig; 