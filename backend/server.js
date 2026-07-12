require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`TransitOps API listening on http://localhost:${PORT}`);
  try {
    await testConnection();
    console.log('Connected to PostgreSQL database.');
  } catch (err) {
    console.error('WARNING: Could not connect to the database:', err.message);
    console.error('Set DATABASE_URL correctly and run "npm run db:migrate" then "npm run db:seed".');
  }
});
