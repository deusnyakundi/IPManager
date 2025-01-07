const ipaddr = require('ipaddr.js');

const calculateNextAvailableIP = async (client, ipRange) => {
  // Get all assigned IPs in this range
  const result = await client.query(
    'SELECT assigned_ip FROM ip_assignments WHERE assigned_ip << $1',
    [`${ipRange.start_ip}/30`]
  );

  const assignedIPs = new Set(result.rows.map(row => row.assigned_ip));
  const startIP = ipaddr.parse(ipRange.start_ip);
  const endIP = ipaddr.parse(ipRange.end_ip);

  let currentIP = startIP;
  while (currentIP.toString() <= endIP.toString()) {
    // Check if this /30 block is available
    const network = `${currentIP.toString()}/30`;
    if (!isBlockAssigned(network, assignedIPs)) {
      return network;
    }
    // Move to next /30 block
    currentIP = incrementIP(currentIP, 4);
  }
  
  throw new Error('No available IP addresses in this range');
};

const incrementIP = (ip, increment) => {
  const parts = ip.toByteArray();
  let carry = increment;
  
  for (let i = parts.length - 1; i >= 0; i--) {
    const sum = parts[i] + carry;
    parts[i] = sum % 256;
    carry = Math.floor(sum / 256);
    if (carry === 0) break;
  }
  
  return ipaddr.fromByteArray(parts);
};

const isBlockAssigned = (network, assignedIPs) => {
  const [baseIP] = network.split('/');
  const networkAddr = ipaddr.parse(baseIP);
  
  for (let i = 0; i < 4; i++) {
    const testIP = incrementIP(networkAddr, i).toString();
    if (assignedIPs.has(testIP)) return true;
  }
  return false;
};

module.exports = {
  calculateNextAvailableIP,
  incrementIP,
  isBlockAssigned
}; 