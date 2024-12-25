const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const ipRoutes = require('./routes/ip.routes');
const regionRoutes = require('./routes/region.routes');
const mspsRoutes = require('./routes/msp.routes');
const ipranRoutes = require('./routes/ipran.routes');
const userRoutes = require('./routes/user.routes');
const siteRoutes = require('./routes/site.routes');
const vlanBlockRoutes = require('./routes/vlanblock.routes');
const vcidRoutes = require('./routes/vcid.routes');
const configRoutes = require('./routes/config.routes');
const session = require('express-session');
const ldapAuth = require('./middleware/ldap.middleware');
const helmet = require('helmet');
const loginLimiter = require('./middleware/rateLimit.middleware');
const logger = require('./services/logger.service');

dotenv.config();

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

app.use(helmet());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'sessionId',
}));

app.post('/api/auth/login', loginLimiter, ldapAuth, authRoutes);

const authCheck = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

app.use('/api/admin', authCheck);

app.use('/api/auth', authRoutes);
app.use('/api/ip', ipRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/msps', mspsRoutes);
app.use('/api/ipran-clusters', ipranRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/vlanblock', vlanBlockRoutes);
app.use('/api/vcid', vcidRoutes);
app.use('/api/config', configRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    timestamp: new Date()
  });
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connecting to database:', process.env.DB_NAME);
});
