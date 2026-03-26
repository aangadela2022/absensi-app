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
        pctEl.textContent = `${response.percentage}%`;
        
        if (response.percentage < 75) {
            pctEl.style.color = 'var(--danger)'; 
        } else {
            pctEl.style.color = 'var(--success)';
        }
        
        updateChart(response.total_students, response.present_today);
    } else {
        console.error('Failed to load dashboard data', response.message);
    }
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
