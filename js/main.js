class UniversalConverter {
    constructor() {
        this.darkMode = this.getSavedTheme();
        this.converters = {
            // Dokumen & PDF
            'image-to-pdf': {
                name: 'JPG/PNG ke PDF',
                description: 'Gabungkan gambar menjadi PDF',
                icon: 'bi-file-earmark-pdf',
                color: 'text-danger',
                category: 'document',
                accept: ['image/jpeg', 'image/png', 'image/jpg'],
                acceptLabel: 'JPG, PNG'
            },
            'pdf-to-image': {
                name: 'PDF ke JPG/PNG',
                description: 'Extract halaman PDF jadi gambar',
                icon: 'bi-file-image',
                color: 'text-primary',
                category: 'document',
                accept: ['application/pdf'],
                acceptLabel: 'PDF',
                multipleFiles: true
            },
            'pdf-to-text': {
                name: 'PDF ke Teks',
                description: 'Ekstrak teks dari PDF',
                icon: 'bi-file-text',
                color: 'text-info',
                category: 'document',
                accept: ['application/pdf'],
                acceptLabel: 'PDF'
            },
            'text-to-pdf': {
                name: 'Teks ke PDF',
                description: 'Buat dokumen dari teks',
                icon: 'bi-file-earmark-text',
                color: 'text-success',
                category: 'document',
                accept: ['text/plain', 'text/markdown', '.txt', '.md'],
                acceptLabel: 'TXT, MD',
                showTextArea: true
            },
            'merge-pdf': {
                name: 'Gabungkan PDF',
                description: 'Merge multiple PDF jadi satu',
                icon: 'bi-files',
                color: 'text-warning',
                category: 'document',
                accept: ['application/pdf'],
                acceptLabel: 'PDF',
                multipleFiles: true
            },
            // Gambar
            'image-converter': {
                name: 'PNG ↔ JPG',
                description: 'Konversi format gambar',
                icon: 'bi-image',
                color: 'text-success',
                category: 'image',
                accept: ['image/png', 'image/jpeg', 'image/jpg'],
                acceptLabel: 'PNG, JPG',
                showOptions: 'format'
            },
            'compress-image': {
                name: 'Kompres Gambar',
                description: 'Perkecil ukuran file gambar',
                icon: 'bi-file-zip',
                color: 'text-danger',
                category: 'image',
                accept: ['image/jpeg', 'image/png', 'image/jpg'],
                acceptLabel: 'JPG, PNG',
                showOptions: 'quality'
            },
            'resize-image': {
                name: 'Ubah Ukuran',
                description: 'Resize dimensi gambar',
                icon: 'bi-aspect-ratio',
                color: 'text-primary',
                category: 'image',
                accept: ['image/jpeg', 'image/png', 'image/jpg'],
                acceptLabel: 'JPG, PNG',
                showOptions: 'dimensions'
            }
        };
        
        this.currentConverter = null;
        this.selectedFiles = [];
        this.currentResult = null;
        this.currentResults = [];
        this.converterModal = null;
        this.resultModal = null;
        this.currentImageAspect = null;
        this.isDownloading = false; // Flag untuk cegah double download
        
        // Initialize libraries
        this.initializeLibraries();
        
        this.init();
    }

    initializeLibraries() {
        console.log('🔧 Initializing libraries...');
        
        // jsPDF
        if (typeof window.jspdf !== 'undefined') {
            this.jsPDF = window.jspdf.jsPDF;
            console.log('✅ jsPDF loaded');
        } else {
            console.error('❌ jsPDF failed to load!');
            this.jsPDF = null;
        }
        
        // PDF.js
        if (typeof window.pdfjsLib !== 'undefined') {
            this.pdfjsLib = window.pdfjsLib;
            this.pdfjsLib.GlobalWorkerOptions.workerSrc = 
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            console.log('✅ PDF.js loaded');
        } else {
            console.error('❌ PDF.js failed to load!');
            this.pdfjsLib = null;
        }
        
        // pdf-lib
        if (typeof window.PDFLib !== 'undefined') {
            this.PDFLib = window.PDFLib;
            console.log('✅ pdf-lib loaded');
        } else {
            console.error('❌ pdf-lib failed to load!');
            this.PDFLib = null;
        }
        
        // JSZip
        if (typeof window.JSZip !== 'undefined') {
            this.JSZip = window.JSZip;
            console.log('✅ JSZip loaded');
        } else {
            console.warn('⚠️ JSZip not loaded (multiple files will download individually)');
            this.JSZip = null;
        }
    }

    init() {
    console.log('🚀 Universal Converter initialized');
    this.applyTheme();
    this.renderConverterCards();
    this.setupModalInstances();
    this.setupEventListeners();
    this.setupThemeToggle();
    this.setupTextInputListener();
    this.setupOptionListeners();
    this.checkLibraries();
}

getSavedTheme() {
    return localStorage.getItem('theme') || 'light';
}

applyTheme() {
    document.documentElement.setAttribute('data-theme', this.darkMode);
    this.updateThemeIcon();
}

setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            this.darkMode = this.darkMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', this.darkMode);
            this.applyTheme();
            console.log(`🌓 Theme switched to: ${this.darkMode}`);
        });
    }
}

updateThemeIcon() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = this.darkMode === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }
    }
}
    renderConverterCards() {
        const documentContainer = document.getElementById('documentConverters');
        const imageContainer = document.getElementById('imageConverters');
        
        if (!documentContainer || !imageContainer) {
            console.error('❌ Container elements not found!');
            return;
        }
        
        documentContainer.innerHTML = '';
        imageContainer.innerHTML = '';
        
        Object.entries(this.converters).forEach(([key, converter]) => {
            const cardHTML = this.createConverterCard(key, converter);
            
            if (converter.category === 'document') {
                documentContainer.innerHTML += cardHTML;
            } else {
                imageContainer.innerHTML += cardHTML;
            }
        });
        
        this.setupCardListeners();
        console.log('✅ Converter cards rendered');
    }

    createConverterCard(key, converter) {
        return `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="card converter-card h-100" data-converter="${key}">
                    <div class="card-body text-center">
                        <div class="converter-icon mb-3">
                            <i class="bi ${converter.icon} ${converter.color} display-4"></i>
                        </div>
                        <h5 class="card-title">${converter.name}</h5>
                        <p class="card-text mb-0">${converter.description}</p>
                    </div>
                </div>
            </div>
        `;
    }

    setupCardListeners() {
        document.querySelectorAll('.converter-card').forEach(card => {
            card.addEventListener('click', () => {
                const converterType = card.dataset.converter;
                this.openConverterModal(converterType);
            });
        });
    }

    setupModalInstances() {
        const converterModalEl = document.getElementById('converterModal');
        const resultModalEl = document.getElementById('resultModal');
        
        if (converterModalEl) {
            this.converterModal = new bootstrap.Modal(converterModalEl);
            console.log('✅ Converter modal created');
        } else {
            console.error('❌ Converter modal element not found!');
        }
        
        if (resultModalEl) {
            this.resultModal = new bootstrap.Modal(resultModalEl);
            console.log('✅ Result modal created');
        } else {
            console.error('❌ Result modal element not found!');
        }
    }

    setupEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');
        const convertBtn = document.getElementById('convertBtn');
        
        if (!dropZone || !fileInput || !browseBtn || !convertBtn) {
            console.error('❌ Event listener elements not found!');
            return;
        }
        
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
        
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.handleFileSelection(e.dataTransfer.files);
        });
        
        convertBtn.addEventListener('click', () => {
            this.startConversion();
        });
        
        console.log('✅ Event listeners setup complete');
    }

    setupTextInputListener() {
        const textInput = document.getElementById('textInput');
        const convertBtn = document.getElementById('convertBtn');
        
        if (textInput && convertBtn) {
            textInput.addEventListener('input', () => {
                if (this.currentConverter === 'text-to-pdf') {
                    if (textInput.value.trim().length > 0) {
                        convertBtn.disabled = false;
                    } else if (this.selectedFiles.length === 0) {
                        convertBtn.disabled = true;
                    }
                }
            });
        }
    }

    setupOptionListeners() {
        // Format selector
        const formatSelect = document.getElementById('targetFormat');
        if (formatSelect) {
            formatSelect.addEventListener('change', () => {
                console.log(`📝 Target format: ${formatSelect.value}`);
            });
        }
        
        // Quality slider dengan preview
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', () => {
                qualityValue.textContent = qualitySlider.value + '%';
                this.previewCompressedSize(qualitySlider.value);
            });
        }
        
        // Resize inputs
        const resizeWidth = document.getElementById('resizeWidth');
        const resizeHeight = document.getElementById('resizeHeight');
        const keepAspect = document.getElementById('keepAspectRatio');
        
        if (resizeWidth && resizeHeight && keepAspect) {
            resizeWidth.addEventListener('input', () => {
                if (keepAspect.checked && this.currentImageAspect) {
                    resizeHeight.value = Math.round(resizeWidth.value / this.currentImageAspect);
                }
            });
            
            resizeHeight.addEventListener('input', () => {
                if (keepAspect.checked && this.currentImageAspect) {
                    resizeWidth.value = Math.round(resizeHeight.value * this.currentImageAspect);
                }
            });
        }
    }

    async previewCompressedSize(quality) {
        if (this.currentConverter !== 'compress-image' || this.selectedFiles.length === 0) {
            return;
        }
        
        const file = this.selectedFiles[0];
        const sizePreview = document.getElementById('sizePreview');
        
        try {
            // Tampilkan original size
            document.getElementById('originalSizePreview').textContent = 
                this.formatFileSize(file.size);
            
            // Buat preview compressed
            const img = await this.createImageFromFile(file);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const qualityValue = parseInt(quality) / 100;
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', qualityValue);
            });
            
            // Update preview
            document.getElementById('estimatedSize').textContent = 
                this.formatFileSize(blob.size);
            
            const reduction = ((file.size - blob.size) / file.size) * 100;
            const reductionEl = document.getElementById('sizeReduction');
            reductionEl.textContent = reduction > 0 ? 
                `${reduction.toFixed(1)}% lebih kecil` : 
                'Tidak ada pengurangan';
            reductionEl.className = reduction > 0 ? 'text-success' : 'text-warning';
            
            sizePreview.style.display = 'block';
        } catch (error) {
            console.error('Error previewing size:', error);
        }
    }

    openConverterModal(type) {
        this.currentConverter = type;
        const converter = this.converters[type];
        
        // Reset state
        this.selectedFiles = [];
        this.currentResults = [];
        this.currentImageAspect = null;
        this.isDownloading = false;
        
        document.getElementById('fileInput').value = '';
        document.getElementById('fileListContainer').style.display = 'none';
        document.getElementById('fileList').innerHTML = '';
        document.getElementById('fileCount').textContent = '0';
        document.getElementById('convertBtn').disabled = true;
        document.getElementById('textInput').value = '';
        document.getElementById('multipleFilesPreview').style.display = 'none';
        
        // Reset size preview
        const sizePreview = document.getElementById('sizePreview');
        if (sizePreview) sizePreview.style.display = 'none';
        
        // Configure file input
        const fileInput = document.getElementById('fileInput');
        if (converter.multipleFiles) {
            fileInput.multiple = true;
        } else {
            fileInput.multiple = false;
        }
        
        // Show/hide text area
        const textInputArea = document.getElementById('textInputArea');
        if (textInputArea) {
            textInputArea.style.display = converter.showTextArea ? 'block' : 'none';
        }
        
        // Show/hide options
        this.showConverterOptions(converter.showOptions);
        
        // Update modal content
        document.getElementById('modalTitle').textContent = converter.name;
        document.getElementById('converterDescription').textContent = converter.description;
        document.getElementById('supportedFormats').textContent = converter.acceptLabel;
        
        // Set file input accept
        if (converter.accept.some(type => type.includes('/'))) {
            fileInput.accept = converter.accept.filter(type => type.includes('/')).join(',');
        } else {
            fileInput.accept = converter.accept.join(',');
        }
        
        this.converterModal.show();
        console.log(`🔄 Converter opened: ${converter.name}`);
    }

    showConverterOptions(optionsType) {
        // Hide all option panels first
        const optionPanels = ['formatOptions', 'qualityOptions', 'resizeOptions'];
        optionPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) panel.style.display = 'none';
        });
        
        // Show relevant panel
        if (optionsType === 'format') {
            const panel = document.getElementById('formatOptions');
            if (panel) panel.style.display = 'block';
        } else if (optionsType === 'quality') {
            const panel = document.getElementById('qualityOptions');
            if (panel) panel.style.display = 'block';
        } else if (optionsType === 'dimensions') {
            const panel = document.getElementById('resizeOptions');
            if (panel) panel.style.display = 'block';
        }
        
        // Reset size preview
        const sizePreview = document.getElementById('sizePreview');
        if (sizePreview) sizePreview.style.display = 'none';
    }

    handleFileSelection(files) {
        const converter = this.converters[this.currentConverter];
        const validFiles = [];
        const invalidFiles = [];
        
        Array.from(files).forEach(file => {
            if (this.validateFile(file, converter)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file);
            }
        });
        
        validFiles.forEach(file => {
            if (!this.selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
                this.selectedFiles.push(file);
            }
        });
        
        if (invalidFiles.length > 0) {
            this.showToast(
                `${invalidFiles.length} file tidak valid. Format: ${converter.acceptLabel}`,
                'warning'
            );
        }
        
        this.renderFileList();
        
        // Jika compress-image, tampilkan preview setelah file dipilih
        if (this.currentConverter === 'compress-image' && this.selectedFiles.length > 0) {
            setTimeout(() => {
                const qualitySlider = document.getElementById('qualitySlider');
                if (qualitySlider) {
                    this.previewCompressedSize(qualitySlider.value);
                }
            }, 100);
        }
        
        // Jika resize-image, load dimensi
        if (this.currentConverter === 'resize-image' && this.selectedFiles.length > 0) {
            this.loadImageDimensions(this.selectedFiles[0]);
        }
        
        console.log(`📁 Files selected: ${validFiles.length} valid, ${invalidFiles.length} invalid`);
    }

    async loadImageDimensions(file) {
        try {
            const img = await this.createImageFromFile(file);
            this.currentImageAspect = img.width / img.height;
            
            const resizeWidth = document.getElementById('resizeWidth');
            const resizeHeight = document.getElementById('resizeHeight');
            
            if (resizeWidth && resizeHeight) {
                resizeWidth.value = img.width;
                resizeHeight.value = img.height;
            }
            
            console.log(`📐 Original dimensions: ${img.width}x${img.height}, Aspect: ${this.currentImageAspect.toFixed(2)}`);
        } catch (error) {
            console.error('Error loading image dimensions:', error);
        }
    }

    createImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    validateFile(file, converter) {
        if (converter.accept.includes(file.type)) {
            return true;
        }
        
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (converter.accept.includes(extension)) {
            return true;
        }
        
        if (converter.name.includes('Teks') && file.type.startsWith('text/')) {
            return true;
        }
        
        return false;
    }

    renderFileList() {
        const fileListContainer = document.getElementById('fileListContainer');
        const fileList = document.getElementById('fileList');
        const fileCount = document.getElementById('fileCount');
        const convertBtn = document.getElementById('convertBtn');
        const textInput = document.getElementById('textInput');
        
        if (this.selectedFiles.length === 0 && 
            !(this.currentConverter === 'text-to-pdf' && textInput.value.trim())) {
            fileListContainer.style.display = 'none';
            convertBtn.disabled = true;
            return;
        }
        
        fileListContainer.style.display = 'block';
        fileList.innerHTML = '';
        fileCount.textContent = this.selectedFiles.length;
        
        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-icon">
                    <i class="bi ${this.getFileIcon(file)}"></i>
                </div>
                <div class="file-info">
                    <p class="file-name" title="${file.name}">${file.name}</p>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                </div>
                <span class="remove-file" data-index="${index}">
                    <i class="bi bi-x-circle"></i>
                </span>
            `;
            
            fileItem.querySelector('.remove-file').addEventListener('click', () => {
                this.removeFile(index);
            });
            
            fileList.appendChild(fileItem);
        });
        
        convertBtn.disabled = false;
        console.log(`📋 File list rendered: ${this.selectedFiles.length} files`);
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.renderFileList();
        
        // Reset preview jika tidak ada file
        if (this.selectedFiles.length === 0) {
            const sizePreview = document.getElementById('sizePreview');
            if (sizePreview) sizePreview.style.display = 'none';
        }
        
        if (this.selectedFiles.length === 0 && 
            !(this.currentConverter === 'text-to-pdf' && document.getElementById('textInput').value.trim())) {
            document.getElementById('fileInput').value = '';
            document.getElementById('convertBtn').disabled = true;
        }
        
        console.log(`🗑️ File removed. Remaining: ${this.selectedFiles.length}`);
    }

    getFileIcon(file) {
        if (file.type.includes('image')) return 'bi-file-image text-primary';
        if (file.type.includes('pdf')) return 'bi-file-pdf text-danger';
        if (file.type.includes('text')) return 'bi-file-text text-info';
        return 'bi-file-earmark text-secondary';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async startConversion() {
        const textInput = document.getElementById('textInput');
        
        if (this.selectedFiles.length === 0 && 
            !(this.currentConverter === 'text-to-pdf' && textInput.value.trim())) {
            this.showToast('Pilih file atau masukkan teks terlebih dahulu!', 'warning');
            return;
        }
        
        if (!this.checkConverterLibraries()) {
            return;
        }
        
        console.log(`🔄 Starting conversion: ${this.converters[this.currentConverter].name}`);
        
        this.showLoading('Mengkonversi...');
        
        try {
            let result;
            
            switch (this.currentConverter) {
                case 'text-to-pdf':
                    result = await this.convertTextToPdf();
                    break;
                    
                case 'image-to-pdf':
                    result = await this.convertImageToPdf();
                    break;
                    
                case 'pdf-to-text':
                    result = await this.convertPdfToText();
                    break;
                    
                case 'pdf-to-image':
                    result = await this.convertPdfToImage();
                    break;
                    
                case 'merge-pdf':
                    result = await this.mergePdf();
                    break;
                    
                case 'image-converter':
                    result = await this.convertImageFormat();
                    break;
                    
                case 'compress-image':
                    result = await this.compressImage();
                    break;
                    
                case 'resize-image':
                    result = await this.resizeImage();
                    break;
                    
                default:
                    throw new Error('Converter belum diimplementasikan');
            }
            
            this.hideLoading();
            this.showResult(result);
            
            console.log('✅ Conversion completed');
        } catch (error) {
            this.hideLoading();
            this.showToast('Gagal konversi: ' + error.message, 'error');
            console.error('❌ Conversion error:', error);
        }
    }

    checkConverterLibraries() {
        const converter = this.currentConverter;
        
        if (converter === 'text-to-pdf' || converter === 'image-to-pdf') {
            if (!this.jsPDF) {
                this.showToast('jsPDF library tidak loaded!', 'error');
                return false;
            }
        }
        
        if (converter === 'pdf-to-text' || converter === 'pdf-to-image') {
            if (!this.pdfjsLib) {
                this.showToast('PDF.js library tidak loaded!', 'error');
                return false;
            }
        }
        
        if (converter === 'merge-pdf') {
            if (!this.PDFLib) {
                this.showToast('pdf-lib library tidak loaded!', 'error');
                return false;
            }
        }
        
        // Image converters don't need special libraries (use Canvas API)
        return true;
    }

    // ========== TEXT TO PDF ==========
    async convertTextToPdf() {
        const textInput = document.getElementById('textInput');
        let text = textInput.value.trim();
        
        if (!text && this.selectedFiles.length > 0) {
            text = await this.readTextFile(this.selectedFiles[0]);
        }
        
        if (!text) {
            throw new Error('Tidak ada teks untuk dikonversi');
        }
        
        const pdf = new this.jsPDF();
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        let y = margin;
        const lineHeight = 7;
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        lines.forEach((line) => {
            if (y > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(line, margin, y);
            y += lineHeight;
        });
        
        const pdfBlob = pdf.output('blob');
        
        console.log(`✅ Text to PDF: ${lines.length} lines converted`);
        
        return {
            fileName: 'dokumen-teks.pdf',
            fileSize: pdfBlob.size,
            blob: pdfBlob,
            mimeType: 'application/pdf'
        };
    }

    // ========== IMAGE TO PDF ==========
    async convertImageToPdf() {
        const images = this.selectedFiles;
        
        if (images.length === 0) {
            throw new Error('Pilih minimal 1 gambar');
        }
        
        const pdf = new this.jsPDF();
        
        for (let i = 0; i < images.length; i++) {
            const imageData = await this.readImageFile(images[i]);
            
            if (i > 0) {
                pdf.addPage();
            }
            
            const imgProps = pdf.getImageProperties(imageData);
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            let imgWidth = pageWidth;
            let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            
            if (imgHeight > pageHeight) {
                imgHeight = pageHeight;
                imgWidth = (imgProps.width * imgHeight) / imgProps.height;
            }
            
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            
            const format = images[i].type === 'image/png' ? 'PNG' : 'JPEG';
            pdf.addImage(imageData, format, x, y, imgWidth, imgHeight);
        }
        
        const pdfBlob = pdf.output('blob');
        
        console.log(`✅ Image to PDF: ${images.length} images converted`);
        
        return {
            fileName: 'gambar-ke-pdf.pdf',
            fileSize: pdfBlob.size,
            blob: pdfBlob,
            mimeType: 'application/pdf'
        };
    }

    // ========== PDF TO TEXT ==========
    async convertPdfToText() {
        const pdfFile = this.selectedFiles[0];
        
        if (!pdfFile) {
            throw new Error('Pilih file PDF terlebih dahulu');
        }
        
        this.updateProgress('Membaca PDF...', 30);
        
        const arrayBuffer = await this.readFileAsArrayBuffer(pdfFile);
        const pdf = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            this.updateProgress(`Mengekstrak halaman ${pageNum} dari ${totalPages}...`, 
                30 + (pageNum / totalPages) * 60);
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += `=== Halaman ${pageNum} ===\n\n${pageText}\n\n`;
        }
        
        if (!fullText.trim()) {
            throw new Error('Tidak ada teks yang dapat diekstrak dari PDF ini');
        }
        
        const textBlob = new Blob([fullText], { type: 'text/plain' });
        
        console.log(`✅ PDF to Text: ${totalPages} pages processed`);
        
        return {
            fileName: pdfFile.name.replace('.pdf', '') + '-teks.txt',
            fileSize: textBlob.size,
            blob: textBlob,
            mimeType: 'text/plain'
        };
    }

    // ========== PDF TO IMAGE ==========
    async convertPdfToImage() {
        const pdfFile = this.selectedFiles[0];
        
        if (!pdfFile) {
            throw new Error('Pilih file PDF terlebih dahulu');
        }
        
        this.updateProgress('Membaca PDF...', 20);
        
        const arrayBuffer = await this.readFileAsArrayBuffer(pdfFile);
        const pdf = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const totalPages = pdf.numPages;
        const images = [];
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            this.updateProgress(`Mengkonversi halaman ${pageNum} dari ${totalPages}...`, 
                20 + (pageNum / totalPages) * 70);
            
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const imageBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.9);
            });
            
            images.push({
                fileName: pdfFile.name.replace('.pdf', '') + `-halaman-${pageNum}.jpg`,
                blob: imageBlob,
                fileSize: imageBlob.size
            });
        }
        
        console.log(`✅ PDF to Image: ${totalPages} pages converted`);
        
        if (images.length === 1) {
            return {
                fileName: images[0].fileName,
                fileSize: images[0].fileSize,
                blob: images[0].blob,
                mimeType: 'image/jpeg'
            };
        }
        
        return {
            multiple: true,
            files: images,
            totalFiles: images.length
        };
    }

    // ========== MERGE PDF ==========
    async mergePdf() {
        const pdfFiles = this.selectedFiles;
        
        if (pdfFiles.length < 2) {
            throw new Error('Pilih minimal 2 file PDF untuk digabungkan');
        }
        
        this.updateProgress('Membaca file PDF...', 20);
        
        const mergedPdf = await this.PDFLib.PDFDocument.create();
        
        for (let i = 0; i < pdfFiles.length; i++) {
            this.updateProgress(`Menggabungkan file ${i + 1} dari ${pdfFiles.length}...`, 
                20 + (i / pdfFiles.length) * 70);
            
            const arrayBuffer = await this.readFileAsArrayBuffer(pdfFiles[i]);
            const pdf = await this.PDFLib.PDFDocument.load(arrayBuffer);
            
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
        }
        
        const mergedPdfBytes = await mergedPdf.save();
        const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        
        console.log(`✅ Merge PDF: ${pdfFiles.length} files merged`);
        
        return {
            fileName: 'gabungan-' + Date.now() + '.pdf',
            fileSize: mergedPdfBlob.size,
            blob: mergedPdfBlob,
            mimeType: 'application/pdf'
        };
    }

    // ========== IMAGE FORMAT CONVERTER ==========
    async convertImageFormat() {
        const imageFile = this.selectedFiles[0];
        const targetFormat = document.getElementById('targetFormat').value;
        
        if (!imageFile) {
            throw new Error('Pilih gambar terlebih dahulu');
        }
        
        this.updateProgress('Mengkonversi format...', 50);
        
        const img = await this.createImageFromFile(imageFile);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        
        if (targetFormat === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        const mimeType = targetFormat === 'png' ? 'image/png' : 'image/jpeg';
        const quality = targetFormat === 'png' ? 1.0 : 0.9;
        
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, mimeType, quality);
        });
        
        const extension = targetFormat === 'png' ? 'png' : 'jpg';
        const fileName = imageFile.name.replace(/\.[^.]+$/, '') + '.' + extension;
        
        console.log(`✅ Image converted to ${extension.toUpperCase()}`);
        
        return {
            fileName: fileName,
            fileSize: blob.size,
            blob: blob,
            mimeType: mimeType
        };
    }

    // ========== COMPRESS IMAGE ==========
    async compressImage() {
        const imageFile = this.selectedFiles[0];
        const quality = parseInt(document.getElementById('qualitySlider').value) / 100;
        
        if (!imageFile) {
            throw new Error('Pilih gambar terlebih dahulu');
        }
        
        this.updateProgress('Mengkompres gambar...', 50);
        
        const img = await this.createImageFromFile(imageFile);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
        });
        
        const originalSize = imageFile.size;
        const compressedSize = blob.size;
        const reduction = ((originalSize - compressedSize) / originalSize) * 100;
        
        console.log(`✅ Image compressed: ${this.formatFileSize(originalSize)} → ${this.formatFileSize(compressedSize)} (${reduction.toFixed(1)}% reduction)`);
        
        return {
            fileName: imageFile.name.replace(/\.[^.]+$/, '') + '-compressed.jpg',
            fileSize: blob.size,
            blob: blob,
            mimeType: 'image/jpeg'
        };
    }

    // ========== RESIZE IMAGE ==========
    async resizeImage() {
        const imageFile = this.selectedFiles[0];
        const width = parseInt(document.getElementById('resizeWidth').value);
        const height = parseInt(document.getElementById('resizeHeight').value);
        
        if (!imageFile) {
            throw new Error('Pilih gambar terlebih dahulu');
        }
        
        if (!width || !height || width < 1 || height < 1) {
            throw new Error('Masukkan dimensi yang valid');
        }
        
        this.updateProgress('Mengubah ukuran gambar...', 50);
        
        const img = await this.createImageFromFile(imageFile);
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        if (imageFile.type === 'image/png') {
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, mimeType, 0.9);
        });
        
        console.log(`✅ Image resized: ${img.width}x${img.height} → ${width}x${height}`);
        
        return {
            fileName: imageFile.name.replace(/\.[^.]+$/, '') + `-resized-${width}x${height}.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
            fileSize: blob.size,
            blob: blob,
            mimeType: mimeType
        };
    }

    // ========== UTILITY FUNCTIONS ==========
    readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    updateProgress(text, percentage) {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingDetail').textContent = `${Math.round(percentage)}%`;
        
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        
        progressContainer.style.display = 'block';
        progressBar.style.width = percentage + '%';
        progressBar.textContent = Math.round(percentage) + '%';
    }

    showResult(result) {
        const downloadBtn = document.getElementById('downloadBtn');
        const multipleFilesPreview = document.getElementById('multipleFilesPreview');
        
        multipleFilesPreview.style.display = 'none';
        downloadBtn.style.display = 'inline-block';
        
        if (result.multiple) {
            this.currentResults = result.files;
            this.currentResult = null;
            
            document.getElementById('resultFileName').textContent = 
                `${result.totalFiles} file berhasil dibuat`;
            document.getElementById('resultFileSize').textContent = '';
            
            multipleFilesPreview.style.display = 'block';
            document.getElementById('multipleFilesCount').textContent = 
                `${result.totalFiles} file berhasil dibuat`;
            
            const filesListContainer = document.getElementById('multipleFilesList');
            filesListContainer.innerHTML = '';
            
            result.files.forEach((file, index) => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'd-flex align-items-center justify-content-between mb-2 p-2 border rounded';
                fileDiv.innerHTML = `
                    <span>
                        <i class="bi bi-file-image text-primary me-2"></i>
                        ${file.fileName}
                        <small class="text-muted ms-2">(${this.formatFileSize(file.fileSize)})</small>
                    </span>
                    <button class="btn btn-sm btn-outline-primary download-single-btn" 
                            data-index="${index}">
                        <i class="bi bi-download"></i>
                    </button>
                `;
                filesListContainer.appendChild(fileDiv);
            });
            
            // Gunakan onclick property (bukan addEventListener)
            filesListContainer.querySelectorAll('.download-single-btn').forEach(btn => {
                btn.onclick = () => {
                    const index = parseInt(btn.dataset.index);
                    this.downloadSingleFile(index);
                };
            });
            
            downloadBtn.textContent = this.JSZip ? 
                '📦 Download Semua (ZIP)' : 
                'Download Semua';
            downloadBtn.onclick = () => this.downloadAllFiles();
        } else {
            this.currentResult = result;
            this.currentResults = [];
            
            document.getElementById('resultFileName').textContent = result.fileName;
            document.getElementById('resultFileSize').textContent = 
                `Size: ${this.formatFileSize(result.fileSize)}`;
            
            downloadBtn.textContent = '📥 Download File';
            downloadBtn.onclick = () => this.downloadResult();
        }
        
        this.converterModal.hide();
        
        setTimeout(() => {
            this.resultModal.show();
        }, 500);
        
        console.log(`📄 Result ready: ${result.multiple ? result.totalFiles + ' files' : result.fileName}`);
    }

// ========== DOWNLOAD METHODS (UPDATED) ==========

    downloadResult() {
    if (this.isDownloading) return;
    this.isDownloading = true;
    
    try {
        if (this.currentResult) {
            const url = URL.createObjectURL(this.currentResult.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentResult.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            console.log(`📥 File downloaded: ${this.currentResult.fileName}`);
            
            // Tampilkan notifikasi sukses
            this.showToast(
                `✅ Berhasil! "${this.currentResult.fileName}" telah diunduh`,
                'success'
            );
        }
    } finally {
        setTimeout(() => {
            this.isDownloading = false;
        }, 1000);
    }
}

downloadSingleFile(index) {
    if (this.isDownloading) return;
    this.isDownloading = true;
    
    try {
        const file = this.currentResults[index];
        if (file) {
            const url = URL.createObjectURL(file.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            console.log(`📥 File downloaded: ${file.fileName}`);
            
            // Tampilkan notifikasi sukses
            this.showToast(
                `✅ Berhasil! "${file.fileName}" telah diunduh`,
                'success'
            );
        }
    } finally {
        setTimeout(() => {
            this.isDownloading = false;
        }, 1000);
    }
}

async downloadAllFiles() {
    if (this.isDownloading) return;
    this.isDownloading = true;
    
    try {
        if (this.JSZip && this.currentResults.length > 1) {
            // Tampilkan loading
            this.showToast('📦 Membuat file ZIP...', 'info');
            
            // Buat ZIP file
            const zip = new this.JSZip();
            
            this.currentResults.forEach((file) => {
                zip.file(file.fileName, file.blob);
            });
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'hasil-konversi.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            console.log(`📦 ZIP downloaded: ${this.currentResults.length} files`);
            
            // Tampilkan notifikasi sukses
            this.showToast(
                `✅ Berhasil! ZIP dengan ${this.currentResults.length} file telah diunduh`,
                'success'
            );
        } else {
            // Fallback: download satu per satu
            this.showToast(
                `📥 Mengunduh ${this.currentResults.length} file...`,
                'info'
            );
            
            for (let i = 0; i < this.currentResults.length; i++) {
                this.downloadSingleFile(i);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Notifikasi selesai
            this.showToast(
                `✅ Berhasil! ${this.currentResults.length} file telah diunduh`,
                'success'
            );
        }
    } catch (error) {
        console.error('Error downloading files:', error);
        this.showToast('❌ Gagal download files', 'error');
    } finally {
        setTimeout(() => {
            this.isDownloading = false;
        }, 1000);
    }
}

    showLoading(text = 'Memproses...') {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingDetail').textContent = '';
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressContainer').style.display = 'none';
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
        document.getElementById('progressContainer').style.display = 'none';
    }

    showToast(message, type = 'info') {
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        toast.innerHTML = `
            <i class="bi ${
                type === 'success' ? 'bi-check-circle' :
                type === 'error' ? 'bi-exclamation-circle' :
                type === 'warning' ? 'bi-exclamation-triangle' :
                'bi-info-circle'
            } me-2"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s reverse';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
        
        console.log(`🔔 Toast shown: ${message}`);
    }

    checkLibraries() {
        console.log('📚 Library Status:');
        console.log(`Bootstrap: ${typeof bootstrap !== 'undefined' ? '✅ Loaded' : '❌ Failed'}`);
        console.log(`Bootstrap Icons: ${document.querySelector('link[href*="bootstrap-icons"]') ? '✅ Loaded' : '❌ Failed'}`);
        console.log(`jsPDF: ${this.jsPDF ? '✅ Loaded' : '❌ Failed'}`);
        console.log(`PDF.js: ${this.pdfjsLib ? '✅ Loaded' : '❌ Failed'}`);
        console.log(`pdf-lib: ${this.PDFLib ? '✅ Loaded' : '❌ Failed'}`);
        console.log(`JSZip: ${this.JSZip ? '✅ Loaded' : '❌ Failed'}`);
        console.log('✅ Phase 5.5: Fixed download & preview ready!');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing app...');
    const app = new UniversalConverter();
    window.app = app;
    console.log('💡 Tips: Ketik "app" di console untuk akses instance');
});