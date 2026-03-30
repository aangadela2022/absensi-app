/**
 * scanner.js - Handles html5-qrcode integration and attendance saving via API
 */

let html5Qrcode = null;
let lastScannedCode = "";
let lastScannedTime = null;

// Local state for table & stats
let scannedStudents = [];
let classStats = {}; // { '10A': { total: 30, hadir: 0 }, ... }

document.addEventListener('DOMContentLoaded', () => {
    initScanner();
    fetchTodayData();
});

function initScanner() {
    html5Qrcode = new Html5Qrcode("reader");

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Try starting the back camera implicitly
    html5Qrcode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
        .catch(err => {
            console.warn("Mencoba kamera lingkungan gagal, mencoba fallback...");
            // Fallback: If environment facing camera fails, try to ask for any camera
            html5Qrcode.start({ facingMode: "user" }, config, onScanSuccess, onScanFailure)
                .catch(err2 => {
                    document.getElementById('reader').innerHTML = `
                        <div style="padding: 20px; color: #fca5a5;">
                            Gagal mengakses kamera: ${err2.message || err2}<br>
                            Pastikan Anda menggunakan HTTPS, atau mengizinkan akses kamera di browser Anda.
                        </div>`;
                });
        });
}

function onScanSuccess(decodedText) {
    // Prevent rapid double scanning of the same code within 5 seconds
    const now = new Date().getTime();
    if (decodedText === lastScannedCode && lastScannedTime && (now - lastScannedTime) < 5000) {
        return; 
    }
    
    lastScannedCode = decodedText;
    lastScannedTime = now;

    processScan(decodedText.trim());
}

function onScanFailure(error) {
    // Silently ignore normal scan failures (searching for QR)
}

function handleManualScan() {
    const manualInput = document.getElementById('manualNis');
    const nis = manualInput.value.trim();
    if (!nis) {
        playErrorSound();
        return;
    }
    
    // Check if the manual NIS was just entered recently to avoid spam clicks
    const now = new Date().getTime();
    if (nis === lastScannedCode && lastScannedTime && (now - lastScannedTime) < 5000) {
        return;
    }
    
    lastScannedCode = nis;
    lastScannedTime = now;
    
    manualInput.value = '';
    processScan(nis);
}

async function fetchTodayData() {
    const response = await Api.fetchData('/attendance/today', 'GET');
    if (response.success) {
        scannedStudents = response.attendance || [];
        classStats = {};
        
        // Initialize stats object from totals
        (response.stats || []).forEach(stat => {
            classStats[stat.kelas] = { total: parseInt(stat.total), hadir: 0 };
        });
        
        // Calculate kehadiran
        scannedStudents.forEach(st => {
            if (classStats[st.kelas]) {
                classStats[st.kelas].hadir += 1;
            }
        });
        
        renderTable();
        renderStats();
    }
}

function renderTable() {
    const tbody = document.getElementById('scannedTableBody');
    document.getElementById('totalScannedToday').textContent = scannedStudents.length;
    
    if (scannedStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--gray); font-size: 0.9rem;">Belum ada data</td></tr>`;
        return;
    }
    
    let html = '';
    // Show top 50 to avoid massive DOM if many students
    const displayList = scannedStudents.slice(0, 50);
    
    displayList.forEach(st => {
        html += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;">
            <td style="padding: 0.75rem 0.5rem; color: var(--gray);">${st.waktu}</td>
            <td style="padding: 0.75rem 0.5rem;">${st.nis}</td>
            <td style="padding: 0.75rem 0.5rem;">${st.nama}</td>
            <td style="padding: 0.75rem 0.5rem;"><span style="background: rgba(79, 70, 229, 0.2); color: var(--secondary); padding: 0.2rem 0.5rem; border-radius: 4px;">${st.kelas}</span></td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

function renderStats() {
    const container = document.getElementById('classStatsContainer');
    const classes = Object.keys(classStats).sort();
    
    if (classes.length === 0) {
        container.innerHTML = `<p style="color: var(--gray); text-align: center; font-size: 0.9rem;">Belum ada kelas.</p>`;
        return;
    }
    
    let html = '';
    classes.forEach(cls => {
        const stats = classStats[cls];
        const pctNum = stats.total > 0 ? (stats.hadir / stats.total) * 100 : 0;
        const pctStr = pctNum.toFixed(1).replace('.', ',');
        
        // Progress bar color based on percentage
        const color = pctNum >= 80 ? 'var(--success)' : (pctNum >= 50 ? 'var(--warning)' : 'var(--danger)');
        
        html += `
            <div style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                    <span>Kelas ${cls}</span>
                    <span style="color: var(--gray);">${stats.hadir} / ${stats.total} (${pctStr}%)</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${pctNum}%; background: ${color}; transition: width 0.5s ease;"></div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateLocalState(student, time) {
    scannedStudents.unshift({
        waktu: time,
        nis: student.nis,
        nama: student.nama,
        kelas: student.kelas
    });
    
    if (classStats[student.kelas]) {
        classStats[student.kelas].hadir += 1;
    }
    
    renderTable();
    renderStats();
}

async function processScan(nis) {
    const resultCard = document.getElementById('scanResult');
    const errorCard = document.getElementById('errorResult');
    
    // Hide both initially
    resultCard.className = 'result-card';
    errorCard.classList.remove('show');
    
    // Call backend API
    const response = await Api.fetchData('/attendance/scan', 'POST', { nis });

    if (!response.success && response.status === 404) {
        // Validation Error (Not Found)
        playErrorSound();
        document.getElementById('errMessage').textContent = `NIS (${nis}) tidak ditemukan di database.`;
        errorCard.classList.add('show');
        
        setTimeout(() => errorCard.classList.remove('show'), 3000);
        return;
    }
    
    if (!response.success && response.message === 'Siswa sudah melakukan absensi hari ini') {
        // Already Scanned
        const student = response.student;
        playAlreadySound(student.nama);
        document.getElementById('resTitle').textContent = `⚠️ Sudah Absen Hari Ini`;
        document.getElementById('resTitle').style.color = '#f59e0b';
        resultCard.classList.add('already');
        
        document.getElementById('resName').textContent = student.nama;
        document.getElementById('resClass').textContent = student.kelas;
        document.getElementById('resTime').textContent = '-'; 

    } else if (response.success) {
        // Success
        const student = response.student;
        playSuccessSound(student.nama);
        document.getElementById('resTitle').textContent = `✔ Berhasil Absen`;
        document.getElementById('resTitle').style.color = '#6ee7b7';
        
        document.getElementById('resName').textContent = student.nama;
        document.getElementById('resClass').textContent = student.kelas;
        document.getElementById('resTime').textContent = response.time;
        
        updateLocalState(student, response.time);
    } else {
        // Server Error
        playErrorSound();
        document.getElementById('errMessage').textContent = response.message || 'Gagal terhubung ke server.';
        errorCard.classList.add('show');
        setTimeout(() => errorCard.classList.remove('show'), 3000);
        return;
    }
    
    resultCard.classList.add('show');
    
    // Auto hide
    setTimeout(() => {
        resultCard.classList.remove('show');
        document.getElementById('resTitle').style.color = '';
    }, 4000);
}

/* ==========================================================================
   Voice Notifications (TTS)
   ========================================================================== */
function speak(text) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech to prioritize the newest one immediately if someone is quick
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 1.1; // slightly faster
        window.speechSynthesis.speak(utterance);
    } else {
        // Fallback to beep if unsupported
        synthBeep(600, 100);
    }
}

function playSuccessSound(nama) {
    if(nama) {
        const namaDepan = nama.split(' ')[0];
        speak(namaDepan + " berhasil absen");
    }
}

function playAlreadySound(nama) {
    if(nama) {
        const namaDepan = nama.split(' ')[0];
        speak(namaDepan + " telah absen");
    }
}

function playErrorSound() {
    speak("gagal absen");
}

function synthBeep(freq, dur, type = "sine") {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + dur / 1000);
    setTimeout(() => osc.stop(), dur);
}
