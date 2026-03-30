const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Scan QR to record attendance
router.post('/scan', authenticateToken, async (req, res) => {
    const { nis } = req.body;
    const wibDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const today = wibDate.toISOString().split('T')[0];
    const now = wibDate.toISOString().split('T')[1].substring(0, 5);

    if (!nis) {
        return res.status(400).json({ success: false, message: 'NIS tidak valid' });
    }

    try {
        const { rows: studentRows } = await db.query('SELECT * FROM students WHERE nis = $1', [nis]);
        if (studentRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
        }
        const student = studentRows[0];

        const { rows: attRows } = await db.query('SELECT * FROM attendance WHERE nis = $1 AND tanggal = $2', [nis, today]);
        if (attRows.length > 0) {
            return res.json({ 
                success: false, 
                message: 'Siswa sudah melakukan absensi hari ini',
                student 
            });
        }

        await db.query(`INSERT INTO attendance (nis, tanggal, waktu) VALUES ($1, $2, $3)`, [nis, today, now]);
        res.json({
            success: true,
            message: 'Berhasil Absen',
            student,
            time: now
        });
    } catch (err) {
        console.error('Scan error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Dashboard stats
router.get('/dashboard', authenticateToken, async (req, res) => {
    const wibDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const today = wibDate.toISOString().split('T')[0];
    
    try {
        const { rows: sRows } = await db.query('SELECT COUNT(*) as total_students FROM students');
        const total_students = parseInt(sRows[0].total_students);

        const { rows: aRows } = await db.query('SELECT COUNT(DISTINCT nis) as present_today FROM attendance WHERE tanggal = $1', [today]);
        const present_today = parseInt(aRows[0].present_today);
        
        const percentage = total_students > 0 ? Math.round((present_today / total_students) * 100) : 0;

        // Class stats
        const { rows: classTotalRows } = await db.query('SELECT kelas, COUNT(*) as total FROM students GROUP BY kelas');
        const { rows: classPresentRows } = await db.query('SELECT s.kelas, COUNT(DISTINCT a.nis) as hadir FROM attendance a JOIN students s ON a.nis = s.nis WHERE a.tanggal = $1 GROUP BY s.kelas', [today]);
        
        const class_stats = classTotalRows.map(ct => {
            const cp = classPresentRows.find(p => p.kelas === ct.kelas);
            const hadir = cp ? parseInt(cp.hadir) : 0;
            const totalClass = parseInt(ct.total);
            const pct = totalClass > 0 ? Math.round((hadir / totalClass) * 100) : 0;
            return {
                kelas: ct.kelas,
                total: totalClass,
                hadir,
                percentage: pct
            };
        });

        // Recent scans today
        const { rows: recent_scans } = await db.query(`
            SELECT a.waktu, s.nis, s.nama, s.kelas 
            FROM attendance a 
            JOIN students s ON a.nis = s.nis 
            WHERE a.tanggal = $1 
            ORDER BY a.waktu DESC
        `, [today]);

        res.json({
            success: true,
            total_students,
            present_today,
            percentage,
            class_stats,
            recent_scans
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Get today's attendance details for scanner page
router.get('/today', authenticateToken, async (req, res) => {
    const wibDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const today = wibDate.toISOString().split('T')[0];
    try {
        const { rows: attendance } = await db.query(`
            SELECT a.waktu, s.nis, s.nama, s.kelas 
            FROM attendance a 
            JOIN students s ON a.nis = s.nis 
            WHERE a.tanggal = $1 
            ORDER BY a.waktu DESC
        `, [today]);
        
        const { rows: statsRows } = await db.query(`
            SELECT kelas, COUNT(*) as total 
            FROM students 
            GROUP BY kelas
        `);
        
        res.json({ success: true, attendance, stats: statsRows });
    } catch (err) {
        console.error('API /today error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Report matrix data
router.get('/report', authenticateToken, requireRole('admin'), async (req, res) => {
    const { kelas, start_date, end_date } = req.query;

    try {
        let studentQuery = 'SELECT * FROM students';
        let studentParams = [];
        
        if (kelas && kelas !== 'all') {
            studentQuery += ' WHERE kelas = $1';
            studentParams.push(kelas);
        }
        
        studentQuery += ' ORDER BY nama ASC';

        const { rows: students } = await db.query(studentQuery, studentParams);
        const { rows: attendanceRecords } = await db.query("SELECT id, nis, TO_CHAR(tanggal, 'YYYY-MM-DD') as tanggal, waktu FROM attendance WHERE tanggal >= $1 AND tanggal <= $2", [start_date, end_date]);

        res.json({
            success: true,
            students,
            attendance: attendanceRecords
        });
    } catch (err) {
        console.error('Report error:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil data laporan' });
    }
});

module.exports = router;
