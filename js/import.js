/**
 * import.js - Handles CSV parsing and saving to backend API
 * Depends on api.js and PapaParse loaded via CDN
 */

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('csvFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    renderStoredStudents();
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('uploadStatus');
    statusEl.className = 'alert';
    statusEl.classList.remove('hidden');
    statusEl.textContent = 'Memproses file...';
    statusEl.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
    statusEl.style.color = '#fcd34d';
    statusEl.style.borderColor = 'rgba(245, 158, 11, 0.2)';

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: function(header) {
            return header.replace(/^\uFEFF/g, '').trim().toLowerCase();
        },
        complete: async function(results) {
            const data = results.data;
            
            if (data.length > 0 && !data[0].hasOwnProperty('nis')) {
                const detected = Object.keys(data[0]).join(', ');
                showStatus(`Format CSV tidak valid! Pastikan ada header nis, nama, kelas. (Terdeteksi header: ${detected})`, 'danger');
                return;
            }

            const validStudents = data.map(row => ({
                nis: row.nis?.trim() || '',
                nama: row.nama?.trim() || '',
                kelas: row.kelas?.trim() || ''
            })).filter(s => s.nis !== '');

            // Send to backend API
            statusEl.textContent = 'Mengunggah ke server...';
            
            const response = await Api.fetchData('/students/import', 'POST', validStudents);
            
            if (response.success) {
                showStatus(response.message || `Berhasil mengimpor ${validStudents.length} data siswa.`, 'success');
                renderStoredStudents();
            } else {
                showStatus(response.message || 'Gagal menyimpan data ke server', 'danger');
            }
            
            event.target.value = '';
        },
        error: function(error) {
            showStatus('Gagal membaca file: ' + error.message, 'danger');
        }
    });
}

function showStatus(message, type) {
    const statusEl = document.getElementById('uploadStatus');
    statusEl.textContent = message;
    
    if (type === 'success') {
        statusEl.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        statusEl.style.color = '#6ee7b7';
        statusEl.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    } else {
        statusEl.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        statusEl.style.color = '#fca5a5';
        statusEl.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    }
}

async function renderStoredStudents() {
    const tableBody = document.querySelector('#studentsTable tbody');
    const container = document.getElementById('previewContainer');
    const countEl = document.getElementById('countSiswa');
    
    // Fetch from API
    const response = await Api.fetchData('/students', 'GET');
    
    if (!response.success) {
        return;
    }
    
    const students = response.data || [];
    countEl.textContent = students.length;
    
    if (students.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    tableBody.innerHTML = '';

    const displayList = students.slice(0, 50);

    displayList.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${student.nis}</td>
            <td>${student.nama}</td>
            <td>${student.kelas}</td>
        `;
        tableBody.appendChild(tr);
    });

    if (students.length > 50) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" style="text-align: center; color: var(--gray);">... ${students.length - 50} data lainnya ...</td>`;
        tableBody.appendChild(tr);
    }
}
