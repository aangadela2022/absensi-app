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
    db.get("SELECT COUNT(*) AS count FROM users", async (err, row) => {
        if (!err && row.count === 0) {
            const adminPassword = await bcrypt.hash('admin123', 10);
            const operatorPassword = await bcrypt.hash('operator123', 10);
            
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', adminPassword, 'admin']);
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['operator', operatorPassword, 'operator']);
            console.log('Default users (admin, operator) seeded into database.');
        }
    });
};

// Delay short time to ensure table is created
setTimeout(setupUsers, 1000);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));

// Fallback to index.html for undefined routes (for SPA behavior, though we have multipage)
app.use((req, res) => {
    // Basic redirect for any bad endpoint, but our app is multipage HTML
    // We shouldn't serve index.html for API 404s
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, '../index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
