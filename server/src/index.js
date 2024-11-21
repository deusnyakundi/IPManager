const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const ipRoutes = require('./routes/ip.routes');
const regionRoutes = require('./routes/region.routes');
const userRoutes = require('./routes/user.routes');
const siteRoutes = require('./routes/site.routes');
const vlanBlockRoutes = require('./routes/vlanblock.routes');

dotenv.config();

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/ip', ipRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/', vlanBlockRoutes); // Use the VLAN block routes


const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connecting to database:', process.env.DB_NAME);
});
