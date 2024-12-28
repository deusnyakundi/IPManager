const ldapService = require('../services/ldap.service');
const logger = require('../services/logger.service');

const ldapAuth = async (req, res, next) => {
  // Skip LDAP if it's not properly configured
  if (process.env.LDAP_ENABLED !== 'true') {
    return next(); // Continue to regular auth
  }

  try {
    const { username, password } = req.body;
    const ipAddress = req.ip;
    
    // Attempt LDAP authentication
    const user = await ldapService.authenticate(username, password);
    
    if (user) {
      // LDAP authentication successful
      req.session.user = {
        username: user.sAMAccountName,
        email: user.mail,
        firstName: user.givenName,
        lastName: user.sn,
        groups: user.memberOf,
        lastLogin: new Date(),
        ipAddress,
        authMethod: 'ldap'
      };

      logger.info('Successful LDAP login', {
        username: user.sAMAccountName,
        ip: ipAddress,
        timestamp: new Date()
      });

      return next();
    }

    // If LDAP fails, continue to regular auth
    return next();

  } catch (error) {
    logger.error('LDAP Authentication Error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
    // On LDAP error, continue to regular auth
    return next();
  }
};

module.exports = ldapAuth; 