require('dotenv').config();
const { Pool } = require('pg');

// Gunakan connection string dari environment variable atau fallback lokal
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/absensi',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    // console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

async function initDb() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            nis VARCHAR(50) UNIQUE NOT NULL,
            nama VARCHAR(255) NOT NULL,
            kelas VARCHAR(50) NOT NULL
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS attendance (
            id SERIAL PRIMARY KEY,
            nis VARCHAR(50) NOT NULL,
            tanggal DATE NOT NULL,
            waktu TIME NOT NULL,
            FOREIGN KEY (nis) REFERENCES students(nis) ON DELETE CASCADE
        )`);
        console.log('Database tables verified for PostgreSQL.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initDb();

module.exports = pool;
