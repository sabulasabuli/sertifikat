/**
 * =====================================================
 * SERTIFIKAT DOWNLOAD - Pure Vanilla JavaScript
 * =====================================================
 */

// ===== DOM Elements =====
const jenjangSelect = document.getElementById('jenjang');
const sekolahSelect = document.getElementById('sekolah');
const pesertaSelect = document.getElementById('peserta');
const btnDownload = document.getElementById('btnDownload');

const previewNotice = document.getElementById('previewNotice');
const certificateWrapper = document.getElementById('certificateWrapper');
const certificate = document.getElementById('certificate');
const loadingOverlay = document.getElementById('loadingOverlay');
const certificateExport = document.getElementById('certificateExport');

const certName = document.getElementById('certName');
const certSchool = document.getElementById('certSchool');
const certDescription = document.getElementById('certDescription');

const waAdmin = document.getElementById('waAdmin');

// ===== Global State =====
let dataJson = {};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', init);

async function init() {
    showLoading(true);

    try {
        await waitForLibraries();
        await loadData();

        // Jenjang harus aktif dari awal
        enableSelect(jenjangSelect);

        // Sekolah & peserta disabled
        disableSelect(sekolahSelect);
        disableSelect(pesertaSelect);

        setupEventListeners();
        updateWhatsAppLink();

    } catch (error) {
        console.error('Init Error:', error);

        // Tetap jalankan website
        enableSelect(jenjangSelect);
        setupEventListeners();
        updateWhatsAppLink();

    } finally {
        showLoading(false);
    }
}

// ===== Wait Library =====
function waitForLibraries() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;

        const interval = setInterval(() => {
            attempts++;

            const htmlReady =
                typeof html2canvas !== 'undefined';

            const pdfReady =
                typeof window.jspdf !== 'undefined' &&
                typeof window.jspdf.jsPDF !== 'undefined';

            if (htmlReady && pdfReady) {
                clearInterval(interval);
                resolve();
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error('Library timeout'));
            }
        }, 100);
    });
}

// ===== Load JSON =====
async function loadData() {
    try {
        const response = await fetch('./data.json');

        if (!response.ok) {
            throw new Error(
                `HTTP error: ${response.status}`
            );
        }

        dataJson = await response.json();

        console.log(
            'Data JSON berhasil dimuat',
            dataJson
        );

    } catch (error) {
        console.error(
            'Gagal load data.json',
            error
        );

        alert(
            'data.json gagal dimuat.\n\n' +
            'Jika membuka file langsung, gunakan Live Server atau localhost.'
        );
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    jenjangSelect.addEventListener(
        'change',
        handleJenjangChange
    );

    sekolahSelect.addEventListener(
        'change',
        handleSekolahChange
    );

    pesertaSelect.addEventListener(
        'change',
        handlePesertaChange
    );

    btnDownload.addEventListener(
        'click',
        generateAndDownloadPDF
    );
}

// ===== Jenjang Change =====
function handleJenjangChange() {
    const jenjang = jenjangSelect.value;

    resetSelect(
        sekolahSelect,
        '-- Pilih Sekolah --'
    );

    resetSelect(
        pesertaSelect,
        '-- Pilih Peserta --'
    );

    disableSelect(pesertaSelect);
    disableButton();
    hideCertificatePreview();

    if (!jenjang) {
        disableSelect(sekolahSelect);
        updateWhatsAppLink();
        return;
    }

    enableSelect(sekolahSelect);
    populateSekolahOptions(jenjang);

    updateWhatsAppLink();
}

// ===== Sekolah Change =====
function handleSekolahChange() {
    const jenjang = jenjangSelect.value;
    const sekolah = sekolahSelect.value;

    resetSelect(
        pesertaSelect,
        '-- Pilih Peserta --'
    );

    disableButton();
    hideCertificatePreview();

    if (!sekolah) {
        disableSelect(pesertaSelect);
        updateWhatsAppLink();
        return;
    }

    enableSelect(pesertaSelect);
    populatePesertaOptions(
        jenjang,
        sekolah
    );

    updateWhatsAppLink();
}

// ===== Peserta Change =====
function handlePesertaChange() {
    const jenjang = jenjangSelect.value;
    const sekolah = sekolahSelect.value;
    const peserta = pesertaSelect.value;

    if (!peserta) {
        disableButton();
        hideCertificatePreview();
        updateWhatsAppLink();
        return;
    }

    showCertificatePreview(
        jenjang,
        sekolah,
        peserta
    );

    enableButton();
    updateWhatsAppLink();
}

// ===== Populate Sekolah =====
function populateSekolahOptions(jenjang) {
    sekolahSelect.innerHTML =
        '<option value="">-- Pilih Sekolah --</option>';

    if (!dataJson[jenjang]) return;

    const schools = Object.keys(
        dataJson[jenjang]
    ).sort();

    schools.forEach(school => {
        const option =
            document.createElement('option');

        option.value = school;
        option.textContent = school;

        sekolahSelect.appendChild(option);
    });
}

// ===== Populate Peserta =====
function populatePesertaOptions(
    jenjang,
    sekolah
) {
    pesertaSelect.innerHTML =
        '<option value="">-- Pilih Peserta --</option>';

    if (
        !dataJson[jenjang] ||
        !dataJson[jenjang][sekolah]
    ) return;

    const participants =
        dataJson[jenjang][sekolah];

    participants.sort().forEach(name => {
        const option =
            document.createElement('option');

        option.value = name;
        option.textContent = name;

        pesertaSelect.appendChild(option);
    });
}

// ===== Certificate Preview =====
function showCertificatePreview(
    jenjang,
    sekolah,
    peserta
) {
    certName.textContent = peserta.toUpperCase();
    certSchool.textContent = sekolah;
    certDescription.textContent = `dalam rangka "SABULA-SABULI PANRANNUANGKU FESTIVAL 2026" tingkat ${jenjang} pada tanggal 16-17 Mei 2026 di Kampung Adat dan Budaya BBRG yang dilaksanakan oleh penerima program perseorangan atas nama "Satriana" dengan judul kegiatan "Pakkiok Bunting Na Aru Tubarani; Digitalisasi dan Festival Sastra Budaya Lisan Makassar"`;

    previewNotice.style.display = 'none';
    certificateWrapper.style.display = 'block';
}

// ===== Hide Preview =====
function hideCertificatePreview() {
    previewNotice.style.display =
        'flex';

    certificateWrapper.style.display =
        'none';
}

// ===== WhatsApp Dynamic =====
function updateWhatsAppLink() {
    if (!waAdmin) return;

    const jenjang =
        jenjangSelect.value || '-';

    const sekolah =
        sekolahSelect.value || '-';

    const peserta =
        pesertaSelect.value || '-';

    const message =
`Halo Admin, saya tidak menemukan nama saya pada sistem download sertifikat.

Detail:
Jenjang: ${jenjang}
Sekolah: ${sekolah}
Nama Peserta: ${peserta}

Mohon bantuannya. Terima kasih.`;

    waAdmin.href =
        `https://wa.me/6281342952931?text=${encodeURIComponent(message)}`;
}

// ===== PDF Generator =====
async function generateAndDownloadPDF() {
    const jenjang = jenjangSelect.value;
    const sekolah = sekolahSelect.value;
    const peserta = pesertaSelect.value;

    if (!jenjang || !sekolah || !peserta) {
        alert('Mohon lengkapi data terlebih dahulu.');
        return;
    }

    // Cek apakah library sudah loaded
    if (typeof html2canvas === 'undefined') {
        alert('Library html2canvas belum loaded. Refresh halaman dan coba lagi.');
        return;
    }

    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert('Library jsPDF belum loaded. Refresh halaman dan coba lagi.');
        return;
    }

    showLoading(true);

    try {
        // Create temporary container
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 1123px;
            height: 794px;
            overflow: hidden;
        `;

        // Clone certificate
        const certEl = document.getElementById('certificate');
        const cloned = certEl.cloneNode(true);

        cloned.style.cssText = `
            position: relative;
            width: 1123px;
            height: 794px;
            overflow: hidden;
        `;

        tempContainer.appendChild(cloned);
        document.body.appendChild(tempContainer);

        // Wait for SVG background to load
        await sleep(500);

        const canvas = await html2canvas(cloned, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: 1123,
            height: 794
        });

        // Remove temp container
        document.body.removeChild(tempContainer);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1123, 794]
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, 1123, 794);

        const fileName = `sertifikat_${peserta.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.pdf`;
        pdf.save(fileName);

        console.log('PDF berhasil dibuat:', fileName);

    } catch (error) {
        console.error('Error PDF:', error);
        alert('Gagal membuat PDF. Pastikan menggunakan Live Server dan coba lagi.');
    } finally {
        showLoading(false);
    }
}

// ===== Helpers =====
function resetSelect(
    element,
    placeholder
) {
    element.innerHTML =
        `<option value="">${placeholder}</option>`;
}

function enableSelect(element) {
    element.disabled = false;
}

function disableSelect(element) {
    element.disabled = true;
}

function enableButton() {
    btnDownload.disabled = false;
}

function disableButton() {
    btnDownload.disabled = true;
}

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove(
            'hidden'
        );
    } else {
        loadingOverlay.classList.add(
            'hidden'
        );
    }
}

function sleep(ms) {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}