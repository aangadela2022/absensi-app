const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_attendance_app_2026';

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const { rows } = await db.query(`SELECT * FROM users WHERE username = $1`, [username]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Username tidak ditemukan' });
        }
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password salah' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            user: { username: user.username, role: user.role }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

module.exports = router;
