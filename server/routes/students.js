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
        
        for (const student of students) {
            if (student.nis && student.nama && student.kelas) {
                await client.query(
                    `INSERT INTO students (nis, nama, kelas) 
                     VALUES ($1, $2, $3) 
                     ON CONFLICT (nis) DO UPDATE 
                     SET nama = EXCLUDED.nama, kelas = EXCLUDED.kelas`, 
                    [student.nis, student.nama, student.kelas]
                );
            }
        }
        
        await client.query('COMMIT');
        res.json({ success: true, message: 'Data siswa berhasil diimpor/diperbarui' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Import error:', err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan/memperbarui data siswa' });
    } finally {
        client.release();
    }
});

module.exports = router;
