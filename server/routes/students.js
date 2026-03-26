const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all students
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM students`);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data siswa' });
    }
});

// Import students
router.post('/import', authenticateToken, requireRole('admin'), async (req, res) => {
    const students = req.body;
    if (!Array.isArray(students)) {
        return res.status(400).json({ success: false, message: 'Format data tidak valid' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Clear existing
        await client.query('DELETE FROM students');
        
        for (const student of students) {
            if (student.nis && student.nama && student.kelas) {
                await client.query(`INSERT INTO students (nis, nama, kelas) VALUES ($1, $2, $3)`, [student.nis, student.nama, student.kelas]);
            }
        }
        
        await client.query('COMMIT');
        res.json({ success: true, message: 'Data siswa berhasil diimpor' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Import error:', err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data siswa' });
    } finally {
        client.release();
    }
});

module.exports = router;
