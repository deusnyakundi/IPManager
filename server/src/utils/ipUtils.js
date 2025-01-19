/**
 * IP address and subnet utility functions
 */

/**
 * Calculate subnet information for a given IP block
 * Currently not used but kept for future subnet calculations
 * @param {string} block - The IP block in CIDR notation
 * @returns {Object} Subnet information
 */
const calculateSubnets = (block) => {
  // For now, we know each /24 block has 64 /30 subnets
  return {
    totalSubnets: 64,
    subnetSize: 30,
    blockSize: 24
  };
};

module.exports = {
  calculateSubnets
}; 