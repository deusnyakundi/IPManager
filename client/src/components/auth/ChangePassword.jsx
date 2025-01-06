import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import api from '../../utils/api';

const ChangePassword = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/first-time-password', {
        userId,
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      // Redirect to login page after successful password change
      navigate('/login', { state: { message: 'Password changed successfully. Please log in with your new password.' } });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Change Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your password must be changed before continuing
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Current Password"
            type="password"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="New Password"
            type="password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handleChange}
            required
            helperText="Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handleChange}
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={isLoading}
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ChangePassword; 