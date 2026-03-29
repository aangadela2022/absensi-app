/**
 * dashboard.js - Handles statistics fetching and rendering via API
 */

let attendanceChart = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    initChart();
});

async function loadDashboardData() {
    const response = await Api.fetchData('/attendance/dashboard', 'GET');
    
    if (response.success) {
        document.getElementById('totalSiswa').textContent = response.total_students;
        document.getElementById('hadirHariIni').textContent = response.present_today;
        const pctEl = document.getElementById('persentaseHadir');
        const formattedPct = parseFloat(response.percentage).toFixed(1).replace('.', ',');
        pctEl.textContent = `${formattedPct}%`;
        
        if (response.percentage < 75) {
            pctEl.style.color = 'var(--danger)'; 
        } else {
            pctEl.style.color = 'var(--success)';
        }
        
        updateChart(response.total_students, response.present_today);
        renderClassStats(response.class_stats);
        renderRecentScans(response.recent_scans);
    } else {
        console.error('Failed to load dashboard data', response.message);
    }
}

function renderClassStats(stats) {
    const container = document.getElementById('classStatsList');
    container.innerHTML = '';
    if (!stats || stats.length === 0) {
        container.innerHTML = '<p style="color: var(--gray); text-align: center;">Belum ada data kelas.</p>';
        return;
    }
    
    // Sort classes alphabetically
    stats.sort((a, b) => a.kelas.localeCompare(b.kelas));

    stats.forEach(stat => {
        const formattedPct = parseFloat(stat.percentage).toFixed(1).replace('.', ',');
        const barColor = stat.percentage < 75 ? 'var(--danger)' : 'var(--success)';
        const html = `
            <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                    <span style="color: var(--white); font-weight: 600;">${stat.kelas}</span>
                    <span style="color: ${barColor}; font-weight: bold;">${formattedPct}%</span>
                </div>
                <div style="width: 100%; background: rgba(255,255,255,0.1); border-radius: 4px; height: 6px; overflow: hidden;">
                    <div style="width: ${stat.percentage}%; background: ${barColor}; height: 100%; border-radius: 4px; transition: width 0.5s;"></div>
                </div>
                <div style="font-size: 0.75rem; color: var(--gray); margin-top: 0.4rem; text-align: right;">
                    ${stat.hadir} / ${stat.total} Siswa Hadir
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

function renderRecentScans(scans) {
    const tbody = document.getElementById('recentScansBody');
    tbody.innerHTML = '';
    if (!scans || scans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">Belum ada scan hari ini.</td></tr>';
        return;
    }
    
    scans.forEach(scan => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--glass-border)';
        tr.innerHTML = `
            <td style="padding: 10px;">${scan.waktu}</td>
            <td style="padding: 10px;">${scan.nis}</td>
            <td style="padding: 10px; color: var(--white); font-weight: 500;">${scan.nama}</td>
            <td style="padding: 10px;">
                <span style="background: rgba(255,255,255,0.1); padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.8rem; color: var(--white);">
                    ${scan.kelas}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initChart() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    // Set default Chart SDK globals to match theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';
    
    attendanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hadir', 'Belum Hadir/Absen'],
            datasets: [{
                label: 'Status Kehadiran',
                data: [0, 100], // default setup
                backgroundColor: [
                    '#10b981', // success
                    '#334155'  // blank
                ],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Rasio Kehadiran Hari Ini' }
            }
        }
    });
}

function updateChart(total, hadir) {
    if (!attendanceChart || total === 0) return;
    
    const absen = total - hadir;
    
    attendanceChart.data.datasets[0].data = [hadir, absen];
    attendanceChart.update();
}
