const getNextAvailableID = async (client, idType, regionId) => {
  const rangeQuery = await client.query(
    'SELECT * FROM vcid_ranges WHERE region_id = $1',
    [regionId]
  );
  
  if (rangeQuery.rows.length === 0) {
    throw new Error(`No ${idType} range defined for this region`);
  }
  
  const range = rangeQuery.rows[0];
  const startField = `start_${idType}`;
  const endField = `end_${idType}`;
  
  const usedIDs = await client.query(
    `SELECT ${idType} FROM ip_assignments WHERE region_id = $1`,
    [regionId]
  );
  
  const usedSet = new Set(usedIDs.rows.map(row => row[idType]));
  
  for (let id = range[startField]; id <= range[endField]; id++) {
    if (!usedSet.has(id)) {
      return id;
    }
  }
  
  throw new Error(`No available ${idType} in the defined range`);
};

const generateVLAN = () => {
  // Generate a random VLAN ID between 100 and 4000
  return Math.floor(Math.random() * (4000 - 100 + 1)) + 100;
};

module.exports = {
  getNextAvailableID,
  generateVLAN
}; 