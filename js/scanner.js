/**
 * scanner.js - Handles html5-qrcode integration and attendance saving via API
 */

let html5Qrcode = null;
let lastScannedCode = "";
let lastScannedTime = null;

document.addEventListener('DOMContentLoaded', () => {
    initScanner();
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
    // Prevent rapid double scanning of the same code within 3 seconds
    const now = new Date().getTime();
    if (decodedText === lastScannedCode && lastScannedTime && (now - lastScannedTime) < 3000) {
        return; 
    }
    
    lastScannedCode = decodedText;
    lastScannedTime = now;

    processScan(decodedText.trim());
}

function onScanFailure(error) {
    // Silently ignore normal scan failures (searching for QR)
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
        playAlreadySound();
        document.getElementById('resTitle').textContent = `⚠️ Sudah Absen Hari Ini`;
        document.getElementById('resTitle').style.color = '#f59e0b';
        resultCard.classList.add('already');
        
        const student = response.student;
        document.getElementById('resName').textContent = student.nama;
        document.getElementById('resClass').textContent = student.kelas;
        // Ideally the API would return existing time, but for now we just show a dash or from state if available
        document.getElementById('resTime').textContent = '-'; 

    } else if (response.success) {
        // Success
        playSuccessSound();
        document.getElementById('resTitle').textContent = `✔ Berhasil Absen`;
        document.getElementById('resTitle').style.color = '#6ee7b7';
        
        const student = response.student;
        document.getElementById('resName').textContent = student.nama;
        document.getElementById('resClass').textContent = student.kelas;
        document.getElementById('resTime').textContent = response.time;
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

// Fallback Sound Synth
function playSuccessSound() {
    try {
        const audio = new Audio('assets/sound/success.mp3');
        audio.play().catch(e => synthBeep(600, 100)); // Fallback if no file
    } catch (e) { synthBeep(600, 100); }
}

function playAlreadySound() {
    synthBeep(300, 200, "square");
}

function playErrorSound() {
    synthBeep(150, 400, "sawtooth");
}

function synthBeep(freq, dur, type = "sine") {
    // Generate beep using Web Audio API as a robust MVP fallback
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
