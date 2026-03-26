const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Scan QR to record attendance
router.post('/scan', authenticateToken, (req, res) => {
    const { nis } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    if (!nis) {
        return res.status(400).json({ success: false, message: 'NIS tidak valid' });
    }

    // Check if student exists
    db.get('SELECT * FROM students WHERE nis = ?', [nis], (err, student) => {
        if (err || !student) {
            return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
        }

        // Check if already attended today
        db.get('SELECT * FROM attendance WHERE nis = ? AND tanggal = ?', [nis, today], (err, record) => {
            if (err) return res.status(500).json({ success: false, message: 'Database error' });

            if (record) {
                return res.json({ 
                    success: false, 
                    message: 'Siswa sudah melakukan absensi hari ini',
                    student 
                });
            }

            // Record attendance
            db.run(`INSERT INTO attendance (nis, tanggal, waktu) VALUES (?, ?, ?)`, [nis, today, now], function(err) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Gagal mencatat absensi' });
                }
                res.json({
                    success: true,
                    message: 'Berhasil Absen',
                    student,
                    time: now
                });
            });
        });
    });
});

// Dashboard stats
router.get('/dashboard', authenticateToken, (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    db.get('SELECT COUNT(*) as total_students FROM students', (err, studentRow) => {
        const total_students = studentRow ? studentRow.total_students : 0;

        db.get('SELECT COUNT(DISTINCT nis) as present_today FROM attendance WHERE tanggal = ?', [today], (err, attRow) => {
            const present_today = attRow ? attRow.present_today : 0;
            const percentage = total_students > 0 ? Math.round((present_today / total_students) * 100) : 0;

            res.json({
                success: true,
                total_students,
                present_today,
                percentage
            });
        });
    });
});

// Report matrix data
router.get('/report', authenticateToken, requireRole('admin'), (req, res) => {
    const { kelas, start_date, end_date } = req.query;

    let studentQuery = 'SELECT * FROM students';
    let studentParams = [];
    if (kelas && kelas !== 'all') {
        studentQuery += ' WHERE kelas = ?';
        studentParams.push(kelas);
    }
    
    // Order students by name
    studentQuery += ' ORDER BY nama ASC';

    db.all(studentQuery, studentParams, (err, students) => {
        if (err) return res.status(500).json({ success: false, message: 'Gagal mengambil data siswa' });

        let attQuery = 'SELECT * FROM attendance WHERE tanggal >= ? AND tanggal <= ?';
        db.all(attQuery, [start_date, end_date], (err, attendanceRecords) => {
             if (err) return res.status(500).json({ success: false, message: 'Gagal mengambil data absensi' });
             
             res.json({
                 success: true,
                 students,
                 attendance: attendanceRecords
             });
        });
    });
});

module.exports = router;
