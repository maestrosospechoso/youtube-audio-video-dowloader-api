class YouTubeDownloader {
    constructor() {
        this.baseURL = window.location.origin;
        this.currentVideoData = null;
        this.initializeElements();
        this.bindEvents();
        this.checkServerStatus();
    }

    initializeElements() {
        this.elements = {
            urlInput: document.getElementById('urlInput'),
            clearBtn: document.getElementById('clearBtn'),
            getInfoBtn: document.getElementById('getInfoBtn'),
            getFormatsBtn: document.getElementById('getFormatsBtn'),
            loading: document.getElementById('loading'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            videoInfo: document.getElementById('videoInfo'),
            thumbnail: document.getElementById('thumbnail'),
            videoTitle: document.getElementById('videoTitle'),
            formatsSection: document.getElementById('formatsSection'),
            formatsGrid: document.getElementById('formatsGrid'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            filterBtns: document.querySelectorAll('.filter-btn')
        };
    }

    bindEvents() {
        this.elements.getInfoBtn.addEventListener('click', () => this.getVideoInfo());
        this.elements.getFormatsBtn.addEventListener('click', () => this.getFormats());
        this.elements.clearBtn.addEventListener('click', () => this.clearInput());
        this.elements.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.getVideoInfo();
        });
        this.elements.urlInput.addEventListener('input', () => this.validateInput());

        // Filter buttons
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.filterFormats(e.target.dataset.filter));
        });
    }

    async checkServerStatus() {
        try {
            const response = await fetch(`${this.baseURL}/`);
            if (response.ok) {
                this.updateStatus('online', 'Servidor conectado');
            } else {
                this.updateStatus('offline', 'Error del servidor');
            }
        } catch (error) {
            this.updateStatus('offline', 'Servidor desconectado');
        }
    }

    updateStatus(status, text) {
        this.elements.statusDot.className = `status-dot ${status}`;
        this.elements.statusText.textContent = text;
    }

    validateInput() {
        const url = this.elements.urlInput.value.trim();
        const isValid = url && (url.includes('youtube.com') || url.includes('youtu.be'));
        this.elements.getInfoBtn.disabled = !isValid;
        return isValid;
    }

    clearInput() {
        this.elements.urlInput.value = '';
        this.hideAllSections();
        this.elements.getInfoBtn.disabled = false;
    }

    hideAllSections() {
        this.elements.videoInfo.classList.remove('show');
        this.elements.formatsSection.classList.remove('show');
        this.elements.errorMessage.classList.remove('show');
        this.elements.loading.classList.remove('show');
    }

    showLoading() {
        this.hideAllSections();
        this.elements.loading.classList.add('show');
    }

    showError(message) {
        this.hideAllSections();
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.classList.add('show');
    }

    async getVideoInfo() {
        const url = this.elements.urlInput.value.trim();
        
        if (!this.validateInput()) {
            this.showError('Por favor, ingresa una URL válida de YouTube');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.baseURL}/info?url=${encodeURIComponent(url)}`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            this.currentVideoData = { ...data, url };
            this.displayVideoInfo(data);
            
        } catch (error) {
            console.error('Error getting video info:', error);
            this.showError(`Error al obtener información del video: ${error.message}`);
        }
    }

    displayVideoInfo(data) {
        this.hideAllSections();
        
        this.elements.thumbnail.src = data.thumbnail;
        this.elements.thumbnail.alt = data.title;
        this.elements.videoTitle.textContent = data.title;
        
        this.elements.videoInfo.classList.add('show');
    }

    async getFormats() {
        if (!this.currentVideoData) {
            this.showError('Primero debes obtener la información del video');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.baseURL}/formats?url=${encodeURIComponent(this.currentVideoData.url)}`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            this.displayFormats(data.formats);
            
        } catch (error) {
            console.error('Error getting formats:', error);
            this.showError(`Error al obtener formatos: ${error.message}`);
        }
    }

    displayFormats(formats) {
        this.hideAllSections();
        
        // Show video info and formats
        this.elements.videoInfo.classList.add('show');
        this.elements.formatsSection.classList.add('show');
        
        this.elements.formatsGrid.innerHTML = '';
        
        formats.forEach(format => {
            const formatCard = this.createFormatCard(format);
            this.elements.formatsGrid.appendChild(formatCard);
        });

        // Reset filter to show all
        this.filterFormats('all');
    }

    createFormatCard(format) {
        const card = document.createElement('div');
        card.className = 'format-card';
        card.dataset.type = this.getFormatType(format);

        const qualityLabel = format.qualityLabel || 'Audio';
        const container = format.container || 'unknown';
        const size = format.contentLength || 'Tamaño desconocido';
        const bitrate = format.audioBitrate ? `${format.audioBitrate} kbps` : 'N/A';

        card.innerHTML = `
            <div class="format-header">
                <div class="format-type">
                    <i class="fas ${this.getFormatIcon(format)}"></i>
                    ${this.getFormatTypeLabel(format)}
                </div>
                <div class="format-quality">${qualityLabel}</div>
            </div>
            <div class="format-details">
                <div class="format-detail">
                    <span>Formato:</span>
                    <span>${container.toUpperCase()}</span>
                </div>
                <div class="format-detail">
                    <span>Tamaño:</span>
                    <span>${size}</span>
                </div>
                <div class="format-detail">
                    <span>Bitrate:</span>
                    <span>${bitrate}</span>
                </div>
                <div class="format-detail">
                    <span>MIME:</span>
                    <span>${format.mimeType.split(';')[0]}</span>
                </div>
            </div>
            <button class="download-btn" onclick="downloader.downloadFormat(${format.itag})">
                <i class="fas fa-download"></i>
                Descargar
            </button>
        `;

        return card;
    }

    getFormatType(format) {
        if (format.qualityLabel && format.audioBitrate) return 'video';
        if (format.audioBitrate && !format.qualityLabel) return 'audio';
        return 'video';
    }

    getFormatTypeLabel(format) {
        const type = this.getFormatType(format);
        return type === 'audio' ? 'Solo Audio' : 'Video + Audio';
    }

    getFormatIcon(format) {
        const type = this.getFormatType(format);
        return type === 'audio' ? 'fa-music' : 'fa-video';
    }

    filterFormats(filterType) {
        // Update active filter button
        this.elements.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterType);
        });

        // Filter format cards
        const cards = this.elements.formatsGrid.querySelectorAll('.format-card');
        cards.forEach(card => {
            const cardType = card.dataset.type;
            const shouldShow = filterType === 'all' || cardType === filterType;
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    async downloadFormat(itag) {
        if (!this.currentVideoData) {
            this.showError('Error: No hay video seleccionado');
            return;
        }

        try {
            const downloadUrl = `${this.baseURL}/download?url=${encodeURIComponent(this.currentVideoData.url)}&itag=${itag}`;
            
            // Create a temporary link to trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success message
            this.showTemporaryMessage('Descarga iniciada...', 'success');
            
        } catch (error) {
            console.error('Error downloading:', error);
            this.showError(`Error al descargar: ${error.message}`);
        }
    }

    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `temporary-message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            ${message}
        `;
        
        // Add styles for temporary message
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : '#0c5460'};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#bee5eb'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(messageDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }
}

// Add CSS for temporary message animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application
const downloader = new YouTubeDownloader();