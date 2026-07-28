const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mydb',
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initDb();

app.get('/', async (req, res) => {
  try {
    await pool.query('INSERT INTO visits DEFAULT VALUES;');
    const result = await pool.query('SELECT COUNT(*) FROM visits;');
    const count = result.rows[0].count;

    res.send(`Hello World from Docker & Postgres! Total Visits: ${count}\n`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection error!');
  }
};

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});