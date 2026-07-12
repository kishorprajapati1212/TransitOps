require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`TransitOps API listening on http://localhost:${PORT}`);
 
});
