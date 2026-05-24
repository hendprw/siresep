import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('Database PostgreSQL terhubung dengan sukses.');
});

pool.on('error', (err) => {
  console.error('Kesalahan tak terduga pada client database:', err);
});

export const query = (text, params) => pool.query(text, params);