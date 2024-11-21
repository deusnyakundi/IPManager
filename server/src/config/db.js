const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
// Log successful connection
pool.on('connect', () => {
    console.log('Connected to the database successfully');
    console.log('Connecting to database:', process.env.DB_NAME);
  });

  // Handle errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
module.exports = pool;
