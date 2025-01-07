import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  FormHelperText,
} from '@mui/material';
import { getValidationError } from '../../utils/validation';

const EditUserDialog = ({ open, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    role: 'user',
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
      });
      setFormErrors({});
      setError('');
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for the field being changed
    setFormErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateForm = () => {
    const errors = {};
    ['email', 'phone', 'role'].forEach(field => {
      const errorMessage = getValidationError(field, formData[field]);
      if (errorMessage) {
        errors[field] = errorMessage;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              disabled
              fullWidth
              size="small"
              InputProps={{
                readOnly: true,
              }}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              size="small"
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!formErrors.phone}
              helperText={formErrors.phone}
            />
            <FormControl fullWidth size="small" error={!!formErrors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
                required
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="support">Support</MenuItem>
                <MenuItem value="planner">Planner</MenuItem>
              </Select>
              {formErrors.role && (
                <FormHelperText>{formErrors.role}</FormHelperText>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            onClose();
            setFormErrors({});
            setError('');
          }} size="small">
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="small">
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditUserDialog; 