const { csrfProtection, setCsrfToken } = require('./middleware/csrf.middleware');
const csrfRoutes = require('./routes/csrf.routes');

// Add CSRF protection
app.use(setCsrfToken);
app.use('/api', csrfProtection);

// Add CSRF routes
app.use('/api', csrfRoutes);

// Update cookie settings for auth cookies
app.use((req, res, next) => {
  res.cookie = function (name, value, options = {}) {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    };
    return res.cookie(name, value, { ...defaultOptions, ...options });
  };
  next();
}); 