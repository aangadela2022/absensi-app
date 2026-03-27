/**
 * laporan.js - Fetch report matrix from API
 */

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    
    document.getElementById('btnGenerate').addEventListener('click', generateMatrix);
    document.getElementById('btnPrint').addEventListener('click', () => window.print());
    document.getElementById('btnExport').addEventListener('click', exportExcel);
});

async function initFilters() {
    // Fill default dates (last 7 days to today)
    const endInput = document.getElementById('endDate');
    const startInput = document.getElementById('startDate');
    
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6);
    
    const fmt = d => d.toISOString().split('T')[0];
    endInput.value = fmt(today);
    startInput.value = fmt(lastWeek);

    // Populate classes dropdown from API
    const response = await Api.fetchData('/students', 'GET');
    if (response.success) {
        const students = response.data;
        const classes = [...new Set(students.map(s => s.kelas).filter(k => k))].sort();
        
        const sel = document.getElementById('filterKelas');
        classes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            sel.appendChild(opt);
        });
    }
}

async function generateMatrix() {
    const filterKelas = document.getElementById('filterKelas').value;
    const startStr = document.getElementById('startDate').value;
    const endStr = document.getElementById('endDate').value;
    
    if (!startStr || !endStr) return alert("Pilih tanggal mulai dan akhir.");
    if (new Date(startStr) > new Date(endStr)) return alert("Tanggal akhir harus lebih besar atau sama dengan tanggal awal.");

    const matrixBody = document.getElementById('matrixBody');
    matrixBody.innerHTML = '<tr><td colspan="100%">Memuat data...</td></tr>';

    const response = await Api.fetchData(`/attendance/report?kelas=${filterKelas}&start_date=${startStr}&end_date=${endStr}`, 'GET');
    
    if (!response.success) {
        matrixBody.innerHTML = `<tr><td colspan="100%">Gagal memuat data: ${response.message}</td></tr>`;
        return;
    }

    const { students, attendance } = response;
    
    // Sort students by Name
    students.sort((a,b) => a.nama.localeCompare(b.nama));

    // Get array of dates in range
    const dates = getDatesBetween(startStr, endStr);
    
    // Header UI Report
    renderReportHeader(filterKelas, startStr, endStr);
    
    // Build Table Header
    const tHeadRow = document.createElement('tr');
    tHeadRow.innerHTML = `<th>No</th><th>Nama/NIS</th>`;
    dates.forEach(d => {
        const dObj = new Date(d);
        const day = String(dObj.getDate()).padStart(2, '0');
        tHeadRow.innerHTML += `<th>${day}</th>`;
    });
    tHeadRow.innerHTML += `<th>%</th>`;
    
    const tHead = document.getElementById('matrixHead');
    tHead.innerHTML = '';
    tHead.appendChild(tHeadRow);
    
    // Build Table Body
    matrixBody.innerHTML = '';
    
    if (students.length === 0) {
        const thCount = dates.length + 3;
        matrixBody.innerHTML = `<tr><td colspan="${thCount}" style="text-align:center;">Tidak ada data siswa ditemukan</td></tr>`;
        return;
    }

    students.forEach((student, index) => {
        const tr = document.createElement('tr');
        
        let htmlCell = `<td>${index+1}</td>
                        <td>
                            <strong>${student.nama}</strong><br>
                            <span style="font-size: 0.8em; color: var(--gray);">${student.nis}</span>
                        </td>`;
        
        let hadirCount = 0;
        
        dates.forEach(d => {
            const isPresent = attendance.find(a => {
                const aDateStr = typeof a.tanggal === 'string' ? a.tanggal.split('T')[0] : a.tanggal;
                return a.nis === student.nis && aDateStr === d;
            });
            if (isPresent) {
                htmlCell += `<td class="status-h">H</td>`;
                hadirCount++;
            } else {
                htmlCell += `<td class="status-a">A</td>`;
            }
        });
        
        const totalHari = dates.length;
        const pct = totalHari > 0 ? Math.round((hadirCount/totalHari)*100) : 0;
        
        // Highlight logic
        const classNames = pct < 75 ? 'low-attendance' : '';
        const pctText = pct < 75 ? `🔴 ${pct}%` : `${pct}%`;
        
        htmlCell += `<td class="${classNames}">${pctText}</td>`;
        
        tr.innerHTML = htmlCell;
        matrixBody.appendChild(tr);
    });
}

function getDatesBetween(start, end) {
    const dateArray = [];
    let currentDate = new Date(start);
    const stopDate = new Date(end);
    
    while (currentDate <= stopDate) {
        dateArray.push(new Date(currentDate).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
}

function renderReportHeader(kelas, start, end) {
    const fmtHead = d => {
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch(e) { return d; }
    };
    
    document.getElementById('rhKelas').textContent = `Kelas   : ${kelas === 'ALL' ? 'Semua Kelas' : kelas}`;
    document.getElementById('rhPeriode').textContent = `Periode : ${fmtHead(start)} - ${fmtHead(end)}`;
    
    const rh = document.getElementById('reportHeader');
    rh.classList.add('show');
}

function exportExcel() {
    const table = document.getElementById("matrixTable");
    const ws = XLSX.utils.table_to_sheet(table);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RekapAbsensi");
    
    const fn = `laporan_absensi_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fn);
}
