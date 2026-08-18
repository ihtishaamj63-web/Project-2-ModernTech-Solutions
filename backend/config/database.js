import dotenv from 'dotenv';
import mysql from 'mysql2';

dotenv.config();

console.log('DB_NAME is:', process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ModernTech_Solutions',
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10
});

export default pool.promise();