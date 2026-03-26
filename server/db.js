const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )`);

        // Students Table
        db.run(`CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nis TEXT UNIQUE NOT NULL,
            nama TEXT NOT NULL,
            kelas TEXT NOT NULL
        )`);

        // Attendance Table
        db.run(`CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nis TEXT NOT NULL,
            tanggal TEXT NOT NULL,
            waktu TEXT NOT NULL,
            FOREIGN KEY (nis) REFERENCES students(nis)
        )`);

        // Seed Admin User if not exists
        // Password is 'admin123' hashed with bcrypt (we will just use a generic hash or plain for now and update later, actually let's just insert plain if we don't use bcrypt yet, wait, we are using bcrypt)
        // Let's insert it carefully in auth.js instead of here to prevent circular dependencies with bcrypt, or just do it here.
    });
}

module.exports = db;
