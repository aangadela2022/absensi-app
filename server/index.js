require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../')));

// Initialize default static users if database is empty
const setupUsers = async () => {
    try {
        const res = await db.query("SELECT COUNT(*) AS count FROM users");
        if (parseInt(res.rows[0].count) === 0) {
            const adminPassword = await bcrypt.hash('admin123', 10);
            const operatorPassword = await bcrypt.hash('operator123', 10);
            
            await db.query(`INSERT INTO users (username, password, role) VALUES ($1, $2, $3)`, ['admin', adminPassword, 'admin']);
            await db.query(`INSERT INTO users (username, password, role) VALUES ($1, $2, $3)`, ['operator', operatorPassword, 'operator']);
            console.log('Default users (admin, operator) seeded into database.');
        }
    } catch (err) {
        console.error('Failed to seed default users:', err);
    }
};

setTimeout(setupUsers, 2000);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));

// Fallback to index.html for undefined routes
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, '../index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
