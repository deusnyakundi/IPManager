const ldap = require('ldapjs');
const config = require('../config/ldap.config');

class LDAPService {
  constructor() {
    if (process.env.LDAP_ENABLED === 'true' && config.ldap.url) {
      this.client = ldap.createClient({
        url: config.ldap.url,
        reconnect: true,
        tlsOptions: {
          rejectUnauthorized: false // Ensure this is set to true in production
        }
      });
    }
  }

  async authenticate(username, password) {
    if (!this.client) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const userDN = `cn=${username},${config.ldap.searchBase}`;
      
      this.client.bind(userDN, password, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.searchUser(username)
          .then(user => resolve(user))
          .catch(err => reject(err));
      });
    });
  }

  async searchUser(username) {
    if (!this.client) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const opts = {
        filter: config.ldap.searchFilter.replace('{{username}}', username),
        scope: 'sub',
        attributes: config.ldap.attributes.user
      };

      this.client.search(config.ldap.searchBase, opts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        let user = null;

        res.on('searchEntry', (entry) => {
          user = entry.object;
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(user);
        });
      });
    });
  }
}

module.exports = new LDAPService(); 