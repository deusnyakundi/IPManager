module.exports = {
  ldap: {
    url: process.env.LDAP_URL,
    baseDN: process.env.LDAP_BASE_DN,
    username: process.env.LDAP_USERNAME,
    password: process.env.LDAP_PASSWORD,
    searchBase: process.env.LDAP_SEARCH_BASE,
    searchFilter: '(sAMAccountName={{username}})',
    attributes: {
      user: ['sAMAccountName', 'givenName', 'sn', 'mail', 'memberOf']
    }
  }
}; 