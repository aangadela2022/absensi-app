const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all students
router.get('/', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM students`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Gagal mengambil data siswa' });
        }
        res.json({ success: true, data: rows });
    });
});

// Import students (Replace all existing or append? The MVP was replacing actually. Let's just clear and insert for simplicity of MVP import)
router.post('/import', authenticateToken, requireRole('admin'), (req, res) => {
    const students = req.body;
    if (!Array.isArray(students)) {
        return res.status(400).json({ success: false, message: 'Format data tidak valid' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Clear existing (optional, but requested behavior is usually to replace all in MVP)
        db.run('DELETE FROM students');

        const stmt = db.prepare(`INSERT INTO students (nis, nama, kelas) VALUES (?, ?, ?)`);
        for (const student of students) {
            if (student.nis && student.nama && student.kelas) {
                stmt.run([student.nis, student.nama, student.kelas]);
            }
        }
        stmt.finalize();

        db.run('COMMIT', (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Gagal menyimpan data siswa' });
            }
            res.json({ success: true, message: 'Data siswa berhasil diimpor' });
        });
    });
});

module.exports = router;
