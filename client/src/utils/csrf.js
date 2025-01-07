// Function to get CSRF token from meta tag
const getCSRFToken = () => {
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag ? metaTag.getAttribute('content') : null;
};

// Function to validate CSRF token format
const isValidCSRFToken = (token) => {
  return token && typeof token === 'string' && token.length >= 32;
};

// Function to refresh CSRF token
const refreshCSRFToken = async () => {
  try {
    const baseURL = process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_API_URL 
      : 'http://localhost:9000/api';
      
    const response = await fetch(`${baseURL}/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update the meta tag with the new token
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      metaTag.setAttribute('content', data.csrfToken);
    }
    
    return data.csrfToken;
  } catch (error) {
    console.error('Error refreshing CSRF token:', error);
    throw error;
  }
};

export { getCSRFToken, isValidCSRFToken, refreshCSRFToken }; 