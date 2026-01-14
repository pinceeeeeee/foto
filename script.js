// HDin Foto WhatsApp - Script Utama
// Optimasi gambar untuk WhatsApp HD

// ============================
// VARIABEL GLOBAL
// ============================

let originalImage = null;
let enhancedImage = null;
let canvas = null;
let ctx = null;
let isProcessing = false;
let currentFileName = '';
let hasFileInputSetup = false; // Flag untuk cek apakah sudah setup

// ============================
// INISIALISASI APLIKASI
// ============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('HDin Foto WhatsApp HD dimulai...');
    initApp();
});

function initApp() {
    console.log('Menginisialisasi aplikasi WhatsApp HD...');
    
    // Setup event listeners - HANYA SEKALI
    setupFileUpload();
    setupSliders();
    setupButtons();
    setupPresets();
    
    // Hapus setup comparison slider (tidak perlu)
    removeComparisonSlider();
    
    // Tampilkan notifikasi sambutan
    setTimeout(() => {
        showNotification('📱 Upload foto yang biasanya pecah di WhatsApp!', 'info');
    }, 1000);
    
    console.log('Aplikasi WhatsApp HD siap!');
}

// Hapus elemen comparison slider dari DOM
function removeComparisonSlider() {
    const comparisonSlider = document.querySelector('.comparison-slider');
    if (comparisonSlider) {
        comparisonSlider.style.display = 'none';
        console.log('Comparison slider dihapus');
    }
}

// ============================
// SETUP UPLOAD FILE (FIXED - SATU KALI)
// ============================

function setupFileUpload() {
    if (hasFileInputSetup) {
        console.log('File upload sudah di-setup, skip...');
        return;
    }
    
    console.log('Setting up file upload...');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    // Hapus event listener lama jika ada
    uploadArea.replaceWith(uploadArea.cloneNode(true));
    fileInput.replaceWith(fileInput.cloneNode(true));
    
    // Dapatkan elemen baru setelah clone
    const newUploadArea = document.getElementById('uploadArea');
    const newFileInput = document.getElementById('fileInput');
    
    // Setup event listeners HANYA SEKALI
    setupUploadEvents(newUploadArea, newFileInput);
    
    hasFileInputSetup = true;
    console.log('File upload setup selesai');
}

function setupUploadEvents(uploadArea, fileInput) {
    // 1. Klik pada upload area
    uploadArea.addEventListener('click', function(e) {
        // Hanya trigger jika bukan klik pada input file
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });
    
    // 2. Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#25D366'; // Warna WhatsApp
        this.style.background = 'rgba(37, 211, 102, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', function() {
        this.style.borderColor = '#4361ee';
        this.style.background = 'rgba(255, 255, 255, 0.08)';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#4361ee';
        this.style.background = 'rgba(255, 255, 255, 0.08)';
        
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            handleImageFile(file);
        }
    });
    
    // 3. File input change - HANYA SATU EVENT LISTENER
    fileInput.addEventListener('change', function(e) {
        console.log('File input changed');
        if (this.files && this.files.length) {
            handleImageFile(this.files[0]);
        }
    }, { once: false }); // Biarkan tetap aktif
    
    console.log('Upload events setup complete');
}

// ============================
// SETUP KOMPONEN LAIN
// ============================

function setupSliders() {
    // Setup semua slider dengan nilai default optimal
    const sliders = [
        { id: 'sharpness', valueId: 'sharpnessValue', defaultValue: 65 },
        { id: 'brightness', valueId: 'brightnessValue', defaultValue: 55 },
        { id: 'contrast', valueId: 'contrastValue', defaultValue: 65 },
        { id: 'saturation', valueId: 'saturationValue', defaultValue: 60 }
    ];
    
    sliders.forEach(slider => {
        const sliderElement = document.getElementById(slider.id);
        const valueElement = document.getElementById(slider.valueId);
        
        // Set nilai default
        sliderElement.value = slider.defaultValue;
        valueElement.textContent = slider.defaultValue;
        
        // Update nilai saat slider diubah
        sliderElement.addEventListener('input', function() {
            valueElement.textContent = this.value;
            
            // Auto-enhance jika gambar sudah dimuat
            if (originalImage && !isProcessing) {
                clearTimeout(window.autoEnhanceTimeout);
                window.autoEnhanceTimeout = setTimeout(() => {
                    enhanceImage();
                }, 300);
            }
        });
    });
}

function setupButtons() {
    // Tombol Enhance
    document.getElementById('enhanceBtn').addEventListener('click', function() {
        if (!originalImage) {
            showNotification('Silakan unggah foto WhatsApp terlebih dahulu', 'error');
            return;
        }
        
        if (isProcessing) {
            showNotification('Sedang mengoptimalkan foto...', 'info');
            return;
        }
        
        enhanceImage();
    });
    
    // Tombol Reset
    document.getElementById('resetBtn').addEventListener('click', function() {
        resetControls();
    });
    
    // Tombol Download
    document.getElementById('downloadBtn').addEventListener('click', function() {
        if (!enhancedImage) {
            showNotification('Tidak ada foto yang dapat diunduh', 'error');
            return;
        }
        
        downloadImage();
    });
}

function setupPresets() {
    const presetButtons = document.querySelectorAll('.preset-btn');
    
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!originalImage) {
                showNotification('Silakan unggah foto terlebih dahulu', 'error');
                return;
            }
            
            const preset = this.getAttribute('data-preset');
            applyPreset(preset);
        });
    });
}

// ============================
// FUNGSI PROSES GAMBAR
// ============================

function handleImageFile(file) {
    console.log('Memproses file untuk WhatsApp HD:', file.name);
    
    // Validasi file
    if (!file.type.startsWith('image/')) {
        showNotification('File harus berupa gambar (JPG, PNG)', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Ukuran file maksimal 5MB', 'error');
        return;
    }
    
    currentFileName = file.name.replace(/\.[^/.]+$/, "");
    
    // Tampilkan loading
    const uploadArea = document.getElementById('uploadArea');
    const originalContent = uploadArea.innerHTML;
    uploadArea.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <h3>Memuat foto...</h3>
        <p>${file.name}</p>
        <p class="format-info">Mengoptimalkan untuk WhatsApp HD...</p>
    `;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        originalImage = new Image();
        originalImage.onload = function() {
            console.log('Foto dimuat:', originalImage.naturalWidth + 'x' + originalImage.naturalHeight);
            displayOriginalImage();
            showNotification('✅ Foto siap dioptimalkan!', 'success');
            
            // Otomatis enhance
            setTimeout(() => {
                enhanceImage();
            }, 500);
        };
        originalImage.onerror = function() {
            showNotification('❌ Gagal memuat foto', 'error');
            resetUploadArea(originalContent);
        };
        originalImage.src = e.target.result;
    };
    
    reader.onerror = function() {
        showNotification('❌ Gagal membaca file', 'error');
        resetUploadArea(originalContent);
    };
    
    reader.readAsDataURL(file);
}

function displayOriginalImage() {
    const originalImageContainer = document.getElementById('originalImageContainer');
    const originalRes = document.getElementById('originalRes');
    const originalSize = document.getElementById('originalSize');
    
    // Clear container
    originalImageContainer.innerHTML = '';
    
    // Create image element
    const img = document.createElement('img');
    img.src = originalImage.src;
    img.alt = 'Foto Asli';
    originalImageContainer.appendChild(img);
    
    // Update info
    originalRes.textContent = `${originalImage.naturalWidth} × ${originalImage.naturalHeight}`;
    originalSize.textContent = formatFileSize(originalImage.src.length * 0.75);
    
    // Reset enhanced image
    resetEnhancedImage();
    
    // Enable enhance button
    document.getElementById('enhanceBtn').disabled = false;
    document.getElementById('downloadBtn').disabled = true;
    
    // Reset upload area ke default
    resetUploadArea();
}

function resetUploadArea(originalContent = null) {
    const uploadArea = document.getElementById('uploadArea');
    
    if (originalContent) {
        uploadArea.innerHTML = originalContent;
    } else {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>Unggah Foto WhatsApp Anda</h3>
            <p>Drag & drop atau klik untuk memilih</p>
            <p class="format-info">Format: JPG, PNG (Maks. 5MB)</p>
        `;
    }
    
    // Reset file input value agar bisa upload file yang sama lagi
    const fileInput = document.getElementById('fileInput');
    fileInput.value = '';
    
    console.log('Upload area direset');
}

function resetEnhancedImage() {
    document.getElementById('enhancedImageContainer').innerHTML = '<p>Hasil WhatsApp HD akan muncul di sini</p>';
    document.getElementById('enhancedRes').textContent = '-';
    document.getElementById('enhancedSize').textContent = '-';
    enhancedImage = null;
}

function enhanceImage() {
    if (!originalImage || isProcessing) return;
    
    console.log('Memulai optimasi WhatsApp HD...');
    
    isProcessing = true;
    const enhanceBtn = document.getElementById('enhanceBtn');
    enhanceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    enhanceBtn.disabled = true;
    
    // Proses optimasi
    setTimeout(() => {
        try {
            optimizeForWhatsApp();
        } catch (error) {
            console.error('Error saat mengoptimalkan foto:', error);
            showNotification('❌ Terjadi kesalahan', 'error');
            resetEnhanceButton();
        }
    }, 100);
}

function optimizeForWhatsApp() {
    // Ambil nilai slider
    const sharpness = parseInt(document.getElementById('sharpness').value);
    const brightness = parseInt(document.getElementById('brightness').value);
    const contrast = parseInt(document.getElementById('contrast').value);
    const saturation = parseInt(document.getElementById('saturation').value);
    
    // Tentukan mode
    const isWAHDExtreme = sharpness > 70 || (sharpness > 65 && contrast > 65);
    
    // Buat canvas
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // OPTIMAL RESOLUSI UNTUK WHATSAPP
    let targetWidth = originalImage.naturalWidth;
    let targetHeight = originalImage.naturalHeight;
    
    // Resize untuk WhatsApp optimal
    const maxDimension = 1600;
    if (targetWidth > maxDimension || targetHeight > maxDimension) {
        const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
        targetWidth = Math.round(targetWidth * scale);
        targetHeight = Math.round(targetHeight * scale);
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    console.log(`Mode: ${isWAHDExtreme ? 'HD Extreme' : 'Standard'}`);
    console.log(`Resolusi: ${canvas.width}x${canvas.height}`);
    
    // Gambar gambar
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Dapatkan data gambar
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Terapkan optimasi
    applyWhatsAppOptimization(data, brightness, contrast, saturation, sharpness, isWAHDExtreme);
    
    // Kembalikan data ke canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Buat gambar hasil
    enhancedImage = new Image();
    enhancedImage.onload = function() {
        displayEnhancedImage();
        resetEnhanceButton();
        showNotification(
            isWAHDExtreme 
                ? '✅ WhatsApp HD Extreme siap!' 
                : '✅ WhatsApp HD siap!', 
            'success'
        );
    };
    enhancedImage.onerror = function() {
        showNotification('❌ Gagal membuat hasil', 'error');
        resetEnhanceButton();
    };
    
    // Kualitas optimal untuk WhatsApp
    const waQuality = isWAHDExtreme ? 0.92 : 0.88;
    enhancedImage.src = canvas.toDataURL('image/jpeg', waQuality);
}

function applyWhatsAppOptimization(data, brightness, contrast, saturation, sharpness, isWAHDExtreme) {
    const length = data.length;
    
    // Parameter optimal
    const brightnessAdj = (brightness - 50) * 1.2;
    const contrastAdj = (contrast - 50) / 80;
    const saturationAdj = saturation / 55;
    const sharpnessAdj = sharpness / 120;
    
    // 1. Brightness dengan tone mapping
    for (let i = 0; i < length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const adaptiveBrightness = brightnessAdj * (1.2 - luminance / 255);
        
        r += adaptiveBrightness;
        g += adaptiveBrightness;
        b += adaptiveBrightness;
        
        data[i] = clamp(r, 0, 255);
        data[i + 1] = clamp(g, 0, 255);
        data[i + 2] = clamp(b, 0, 255);
    }
    
    // 2. Smart contrast
    const contrastFactor = (259 * (255 + contrastAdj * 255)) / (255 * (259 - contrastAdj * 255));
    for (let i = 0; i < length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
        
        data[i] = clamp(r, 0, 255);
        data[i + 1] = clamp(g, 0, 255);
        data[i + 2] = clamp(b, 0, 255);
    }
    
    // 3. Natural saturation
    for (let i = 0; i < length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        data[i] = clamp(luminance + (r - luminance) * saturationAdj, 0, 255);
        data[i + 1] = clamp(luminance + (g - luminance) * saturationAdj, 0, 255);
        data[i + 2] = clamp(luminance + (b - luminance) * saturationAdj, 0, 255);
    }
    
    // 4. Safe sharpening
    if (sharpnessAdj > 0.08) {
        applySafeSharpening(data, canvas.width, canvas.height, sharpnessAdj);
    }
}

function applySafeSharpening(data, width, height, strength) {
    const originalData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            // Edge detection
            let edgeScore = 0;
            for (let c = 0; c < 3; c++) {
                const idx = (y * width + x) * 4 + c;
                const center = originalData[idx];
                
                const top = originalData[((y-1) * width + x) * 4 + c];
                const bottom = originalData[((y+1) * width + x) * 4 + c];
                const left = originalData[(y * width + (x-1)) * 4 + c];
                const right = originalData[(y * width + (x+1)) * 4 + c];
                
                const laplacian = Math.abs(4 * center - top - bottom - left - right);
                edgeScore += laplacian;
            }
            
            edgeScore /= 3;
            
            // Hanya sharpen edges yang jelas
            if (edgeScore > 15 && edgeScore < 100) {
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    const center = originalData[idx];
                    
                    let sum = 0;
                    let count = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nIdx = ((y + dy) * width + (x + dx)) * 4 + c;
                            sum += originalData[nIdx];
                            count++;
                        }
                    }
                    
                    const blurred = sum / count;
                    const sharpened = center + (center - blurred) * strength * 0.3;
                    
                    data[idx] = clamp(sharpened, 0, 255);
                }
            }
        }
    }
}

function displayEnhancedImage() {
    const enhancedImageContainer = document.getElementById('enhancedImageContainer');
    const enhancedRes = document.getElementById('enhancedRes');
    const enhancedSize = document.getElementById('enhancedSize');
    
    // Clear container
    enhancedImageContainer.innerHTML = '';
    
    // Create image element
    const img = document.createElement('img');
    img.src = enhancedImage.src;
    img.alt = 'Hasil WhatsApp HD';
    enhancedImageContainer.appendChild(img);
    
    // Update info
    enhancedRes.textContent = `${canvas.width} × ${canvas.height}`;
    enhancedSize.textContent = formatFileSize(enhancedImage.src.length * 0.75);
    
    // Enable download button
    document.getElementById('downloadBtn').disabled = false;
    
    isProcessing = false;
}

function resetEnhanceButton() {
    const enhanceBtn = document.getElementById('enhanceBtn');
    enhanceBtn.innerHTML = '<i class="fas fa-magic"></i> Optimalkan';
    enhanceBtn.disabled = false;
    isProcessing = false;
}

// ============================
// FUNGSI BANTU
// ============================

function applyPreset(preset) {
    let sharpnessVal, brightnessVal, contrastVal, saturationVal;
    let presetName = '';
    
    switch(preset) {
        case 'portrait':
            sharpnessVal = 60;
            brightnessVal = 58;
            contrastVal = 62;
            saturationVal = 48;
            presetName = 'Potrait';
            break;
        case 'landscape':
            sharpnessVal = 68;
            brightnessVal = 62;
            contrastVal = 70;
            saturationVal = 65;
            presetName = 'Pemandangan';
            break;
        case 'vintage':
            sharpnessVal = 45;
            brightnessVal = 52;
            contrastVal = 58;
            saturationVal = 40;
            presetName = 'Vintage';
            break;
        case 'hd':
            sharpnessVal = 75;
            brightnessVal = 65;
            contrastVal = 72;
            saturationVal = 62;
            presetName = 'HD Extreme';
            break;
        default:
            return;
    }
    
    // Update slider values
    document.getElementById('sharpness').value = sharpnessVal;
    document.getElementById('brightness').value = brightnessVal;
    document.getElementById('contrast').value = contrastVal;
    document.getElementById('saturation').value = saturationVal;
    
    // Update display values
    document.getElementById('sharpnessValue').textContent = sharpnessVal;
    document.getElementById('brightnessValue').textContent = brightnessVal;
    document.getElementById('contrastValue').textContent = contrastVal;
    document.getElementById('saturationValue').textContent = saturationVal;
    
    // Apply enhancements
    enhanceImage();
    
    showNotification(`✅ Preset "${presetName}" diterapkan!`, 'info');
}

function resetControls() {
    // Reset slider values to default
    document.getElementById('sharpness').value = 65;
    document.getElementById('brightness').value = 55;
    document.getElementById('contrast').value = 65;
    document.getElementById('saturation').value = 60;
    
    // Update display values
    document.getElementById('sharpnessValue').textContent = '65';
    document.getElementById('brightnessValue').textContent = '55';
    document.getElementById('contrastValue').textContent = '65';
    document.getElementById('saturationValue').textContent = '60';
    
    if (originalImage) {
        showNotification('⚙️ Pengaturan direset', 'info');
        enhanceImage();
    } else {
        showNotification('⚙️ Pengaturan direset', 'info');
    }
}

function downloadImage() {
    if (!enhancedImage) return;
    
    try {
        // Buat nama file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `whatsapp-hd-${currentFileName || 'foto'}-${timestamp}.jpg`;
        
        // Buat link download
        const link = document.createElement('a');
        link.href = enhancedImage.src;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`📥 Foto siap! Simpan dan kirim via WA!`, 'success');
        
    } catch (error) {
        console.error('Error downloading image:', error);
        showNotification('❌ Gagal mengunduh foto', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    // Set text
    notificationText.textContent = message;
    
    // Set color
    notification.className = 'notification';
    if (type === 'error') {
        notification.style.background = '#e74c3c';
    } else if (type === 'success') {
        notification.style.background = '#25D366';
    } else if (type === 'info') {
        notification.style.background = '#3498db';
    }
    
    // Show notification
    notification.classList.add('show');
    
    // Auto hide
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}