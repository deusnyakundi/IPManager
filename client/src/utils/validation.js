// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Password validation - requires at least 8 characters, one uppercase, one lowercase, one number, and one special character
export const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return passwordRegex.test(password);
};

// Phone number validation - accepts formats: +1234567890, 123-456-7890, (123) 456-7890
export const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
  return phoneRegex.test(phone);
};

// Role validation
export const isValidRole = (role) => {
  const validRoles = ['admin', 'user', 'support', 'planner'];
  return validRoles.includes(role);
};

// Get validation error messages
export const getValidationError = (field, value) => {
  switch (field) {
    case 'email':
      return !value ? 'Email is required' : 
             !isValidEmail(value) ? 'Invalid email format' : '';
    case 'password':
      return !value ? 'Password is required' : 
             !isValidPassword(value) ? 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' : '';
    case 'phone':
      return value && !isValidPhone(value) ? 'Invalid phone number format' : '';
    case 'role':
      return !value ? 'Role is required' : 
             !isValidRole(value) ? 'Invalid role selected' : '';
    default:
      return '';
  }
}; 