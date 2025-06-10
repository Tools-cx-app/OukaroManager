// OukaroManager WebUI Scripts
// System App Converter for KernelSU

class OukaroManager {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.userApps = [];
        this.systemApps = [];
        this.convertedApps = [];
        this.selectedApps = new Set();
        this.conversionMode = 'system'; // 'system' or 'priv-app'
        
        this.init();
    }

    async init() {
        try {
            await this.loadTranslations();
            this.setupEventListeners();
            this.detectLanguage();
            await this.loadInitialData();
            this.updateUI();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Failed to initialize application');
        }
    }

    // Language and Translation Management
    async loadTranslations() {
        try {
            const [enData, zhData] = await Promise.all([
                fetch('locales/en.json').then(r => r.json()),
                fetch('locales/zh.json').then(r => r.json())
            ]);
            
            this.translations = {
                'en': enData,
                'zh': zhData
            };
        } catch (error) {
            console.error('Failed to load translations:', error);
            // Fallback translations
            this.translations = {
                'en': {
                    'app_title': 'OukaroManager',
                    'loading': 'Loading...',
                    'error': 'Error occurred'
                },
                'zh': {
                    'app_title': 'OukaroManager',
                    'loading': '加载中...',
                    'error': '发生错误'
                }
            };
        }
    }

    detectLanguage() {
        const savedLang = localStorage.getItem('oukaroLanguage');
        const browserLang = navigator.language || navigator.userLanguage;
        
        if (savedLang && this.translations[savedLang]) {
            this.currentLanguage = savedLang;
        } else if (browserLang.startsWith('zh')) {
            this.currentLanguage = 'zh';
        } else {
            this.currentLanguage = 'en';
        }
        
        this.updateLanguageSelector();
        this.translatePage();
    }

    updateLanguageSelector() {
        const selector = document.getElementById('languageSelect');
        if (selector) {
            selector.value = this.currentLanguage;
        }
    }

    translatePage() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation) {
                element.textContent = translation;
            }
        });

        // Translate placeholders
        const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translation = this.getTranslation(key);
            if (translation) {
                element.placeholder = translation;
            }
        });

        // Update document title
        const titleTranslation = this.getTranslation('app_title');
        if (titleTranslation) {
            document.title = titleTranslation + ' - System App Converter';
        }
    }

    getTranslation(key) {
        return this.translations[this.currentLanguage]?.[key] || 
               this.translations['en']?.[key] || 
               key;
    }

    changeLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('oukaroLanguage', lang);
            this.translatePage();
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }

        // Tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Mode selection
        document.querySelectorAll('input[name="conversionMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.conversionMode = e.target.value;
                this.updateModeDisplay();
            });
        });

        // Search functionality
        const userAppSearch = document.getElementById('userAppSearch');
        if (userAppSearch) {
            userAppSearch.addEventListener('input', (e) => {
                this.filterApps('user', e.target.value);
            });
        }

        const systemAppSearch = document.getElementById('systemAppSearch');
        if (systemAppSearch) {
            systemAppSearch.addEventListener('input', (e) => {
                this.filterApps('system', e.target.value);
            });
        }

        // Action buttons
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.convertSelectedApps());
        }

        const revertAllBtn = document.getElementById('revertAllBtn');
        if (revertAllBtn) {
            revertAllBtn.addEventListener('click', () => this.revertAllApps());
        }

        const selectAllBtn = document.getElementById('selectAllUser');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllUserApps());
        }

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        const rebootBtn = document.getElementById('rebootBtn');
        if (rebootBtn) {
            rebootBtn.addEventListener('click', () => this.rebootDevice());
        }

        // Modal close functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        const confirmNo = document.getElementById('confirmNo');
        if (confirmNo) {
            confirmNo.addEventListener('click', () => {
                this.closeModal('confirmModal');
            });
        }
    }

    // Data Loading
    async loadInitialData() {
        this.showLoading(true);
        
        try {
            await Promise.all([
                this.loadUserApps(),
                this.loadSystemApps(),
                this.loadConvertedApps(),
                this.checkKSUStatus()
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError(this.getTranslation('error_load_data'));
        } finally {
            this.showLoading(false);
        }
    }

    async loadUserApps() {
        try {
            // For now, use mock data since we don't have a backend API yet
            this.userApps = this.getMockUserApps();
            this.renderAppsList('user', this.userApps);
        } catch (error) {
            console.error('Failed to load user apps:', error);
            this.userApps = this.getMockUserApps();
            this.renderAppsList('user', this.userApps);
        }
    }

    async loadSystemApps() {
        try {
            this.systemApps = this.getMockSystemApps();
            this.renderAppsList('system', this.systemApps);
        } catch (error) {
            console.error('Failed to load system apps:', error);
            this.systemApps = this.getMockSystemApps();
            this.renderAppsList('system', this.systemApps);
        }
    }

    async loadConvertedApps() {
        try {
            // Load from localStorage for now
            const stored = localStorage.getItem('oukaroConvertedApps');
            this.convertedApps = stored ? JSON.parse(stored) : [];
            this.renderAppsList('converted', this.convertedApps);
            this.updateStatusBar();
        } catch (error) {
            console.error('Failed to load converted apps:', error);
            this.convertedApps = [];
            this.renderAppsList('converted', this.convertedApps);
        }
    }

    async checkKSUStatus() {
        try {
            // Mock KSU status check
            const status = 'Active';
            const statusElement = document.getElementById('ksuStatus');
            if (statusElement) {
                statusElement.textContent = status;
                statusElement.className = `status-value ${status.toLowerCase() === 'active' ? 'success' : 'warning'}`;
            }
        } catch (error) {
            console.error('Failed to check KSU status:', error);
            const statusElement = document.getElementById('ksuStatus');
            if (statusElement) {
                statusElement.textContent = 'Error';
                statusElement.className = 'status-value error';
            }
        }
    }

    // UI Management
    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId)?.classList.add('active');
    }

    renderAppsList(type, apps) {
        const listId = type === 'user' ? 'userAppsList' : 
                      type === 'system' ? 'systemAppsList' : 'convertedAppsList';
        const listElement = document.getElementById(listId);
        
        if (!listElement) return;

        if (apps.length === 0) {
            listElement.innerHTML = `<div class="loading" data-translate="no_apps">No apps found</div>`;
            this.translatePage();
            return;
        }

        const itemsHTML = apps.map(app => this.createAppItemHTML(app, type)).join('');
        listElement.innerHTML = itemsHTML;

        // Add event listeners for checkboxes
        if (type === 'user') {
            listElement.querySelectorAll('.app-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    this.toggleAppSelection(e.target.value, e.target.checked);
                });
            });
        }

        // Add event listeners for revert buttons
        if (type === 'converted') {
            listElement.querySelectorAll('.revert-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const packageName = e.target.getAttribute('data-package');
                    this.revertSingleApp(packageName);
                });
            });
        }
    }

    createAppItemHTML(app, type) {
        const isUserApp = type === 'user';
        const isConvertedApp = type === 'converted';
        
        return `
            <div class="app-item" data-package="${app.packageName}">
                ${isUserApp ? `<input type="checkbox" class="app-checkbox" value="${app.packageName}">` : ''}
                <div class="app-icon">
                    ${app.icon ? `<img src="${app.icon}" alt="${app.name}">` : app.name.charAt(0).toUpperCase()}
                </div>
                <div class="app-info">
                    <div class="app-name">${app.name}</div>
                    <div class="app-package">${app.packageName}</div>
                    ${app.version ? `<div class="app-details">v${app.version} | ${app.size || 'Unknown size'}</div>` : ''}
                    ${isConvertedApp ? `<div class="app-details">Mode: ${app.mode} | Converted: ${app.convertedDate}</div>` : ''}
                </div>
                <div class="app-actions">
                    ${isConvertedApp ? `<button class="btn btn-sm btn-danger revert-btn" data-package="${app.packageName}" data-translate="revert">Revert</button>` : ''}
                </div>
            </div>
        `;
    }

    filterApps(type, searchTerm) {
        const apps = type === 'user' ? this.userApps : this.systemApps;
        const filteredApps = apps.filter(app => 
            app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.packageName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderAppsList(type, filteredApps);
    }

    toggleAppSelection(packageName, selected) {
        if (selected) {
            this.selectedApps.add(packageName);
        } else {
            this.selectedApps.delete(packageName);
        }
        this.updateConvertButton();
        this.updateStatusBar();
    }

    selectAllUserApps() {
        const checkboxes = document.querySelectorAll('#userAppsList .app-checkbox');
        const allSelected = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allSelected;
            this.toggleAppSelection(checkbox.value, !allSelected);
        });
    }

    updateConvertButton() {
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.disabled = this.selectedApps.size === 0;
        }
    }

    updateStatusBar() {
        const convertedCount = document.getElementById('convertedCount');
        const queueCount = document.getElementById('queueCount');
        
        if (convertedCount) {
            convertedCount.textContent = this.convertedApps.length;
        }
        
        if (queueCount) {
            queueCount.textContent = this.selectedApps.size;
        }
    }

    updateModeDisplay() {
        console.log('Conversion mode changed to:', this.conversionMode);
    }

    // App Conversion Logic
    async convertSelectedApps() {
        if (this.selectedApps.size === 0) {
            this.showError(this.getTranslation('error_no_apps_selected'));
            return;
        }

        const selectedAppsList = Array.from(this.selectedApps).map(packageName => {
            const app = this.userApps.find(a => a.packageName === packageName);
            return app ? app.name : packageName;
        }).join(', ');

        const confirmMessage = this.getTranslation('confirm_convert_apps')
            .replace('{count}', this.selectedApps.size)
            .replace('{mode}', this.conversionMode)
            .replace('{apps}', selectedAppsList);

        this.showConfirmDialog(confirmMessage, async () => {
            await this.performConversion();
        });
    }

    async performConversion() {
        this.showProgressModal(this.getTranslation('converting_apps'));
        
        try {
            const appsToConvert = Array.from(this.selectedApps).map(packageName => {
                const app = this.userApps.find(a => a.packageName === packageName);
                return {
                    packageName: packageName,
                    name: app?.name || packageName,
                    mode: this.conversionMode,
                    convertedDate: new Date().toLocaleDateString()
                };
            });

            let progress = 0;
            const totalSteps = appsToConvert.length;

            for (const app of appsToConvert) {
                this.updateProgress((progress / totalSteps) * 100, 
                    this.getTranslation('converting_app').replace('{app}', app.name));
                
                // Simulate conversion process
                await this.delay(1000);
                
                // Add to converted apps
                this.convertedApps.push(app);
                
                // Remove from user apps
                this.userApps = this.userApps.filter(ua => ua.packageName !== app.packageName);
                
                progress++;
            }

            this.updateProgress(100, this.getTranslation('conversion_complete'));
            
            // Save to localStorage
            localStorage.setItem('oukaroConvertedApps', JSON.stringify(this.convertedApps));
            
            // Clear selections and refresh data
            this.selectedApps.clear();
            this.renderAppsList('converted', this.convertedApps);
            this.renderAppsList('user', this.userApps);
            this.updateConvertButton();
            this.updateStatusBar();
            
            setTimeout(() => {
                this.closeModal('progressModal');
                this.showRebootDialog();
            }, 1000);

        } catch (error) {
            console.error('Conversion failed:', error);
            this.closeModal('progressModal');
            this.showError(this.getTranslation('error_conversion_failed'));
        }
    }

    async revertSingleApp(packageName) {
        const app = this.convertedApps.find(a => a.packageName === packageName);
        if (!app) return;

        const confirmMessage = this.getTranslation('confirm_revert_app')
            .replace('{app}', app.name);

        this.showConfirmDialog(confirmMessage, async () => {
            try {
                // Remove from converted apps
                this.convertedApps = this.convertedApps.filter(ca => ca.packageName !== packageName);
                
                // Add back to user apps
                this.userApps.push({
                    packageName: app.packageName,
                    name: app.name,
                    version: '1.0.0',
                    size: '10MB'
                });
                
                // Save to localStorage
                localStorage.setItem('oukaroConvertedApps', JSON.stringify(this.convertedApps));
                
                this.renderAppsList('converted', this.convertedApps);
                this.renderAppsList('user', this.userApps);
                this.updateStatusBar();
                
                this.showSuccess(this.getTranslation('app_reverted'));
            } catch (error) {
                console.error('Revert failed:', error);
                this.showError(this.getTranslation('error_revert_failed'));
            }
        });
    }

    async revertAllApps() {
        if (this.convertedApps.length === 0) {
            this.showError(this.getTranslation('error_no_converted_apps'));
            return;
        }

        const confirmMessage = this.getTranslation('confirm_revert_all')
            .replace('{count}', this.convertedApps.length);

        this.showConfirmDialog(confirmMessage, async () => {
            this.showProgressModal(this.getTranslation('reverting_apps'));
            
            try {
                // Add all converted apps back to user apps
                this.convertedApps.forEach(app => {
                    this.userApps.push({
                        packageName: app.packageName,
                        name: app.name,
                        version: '1.0.0',
                        size: '10MB'
                    });
                });
                
                this.convertedApps = [];
                
                this.updateProgress(100, this.getTranslation('revert_complete'));
                
                // Save to localStorage
                localStorage.setItem('oukaroConvertedApps', JSON.stringify(this.convertedApps));
                
                this.renderAppsList('converted', this.convertedApps);
                this.renderAppsList('user', this.userApps);
                this.updateStatusBar();
                
                setTimeout(() => {
                    this.closeModal('progressModal');
                    this.showSuccess(this.getTranslation('all_apps_reverted'));
                }, 1000);

            } catch (error) {
                console.error('Revert all failed:', error);
                this.closeModal('progressModal');
                this.showError(this.getTranslation('error_revert_failed'));
            }
        });
    }

    async refreshData() {
        await this.loadInitialData();
        this.showSuccess(this.getTranslation('data_refreshed'));
    }

    async rebootDevice() {
        const confirmMessage = this.getTranslation('confirm_reboot');
        
        this.showConfirmDialog(confirmMessage, async () => {
            try {
                this.showSuccess(this.getTranslation('reboot_initiated'));
                // In a real implementation, this would trigger a system reboot
            } catch (error) {
                console.error('Reboot failed:', error);
                this.showError(this.getTranslation('error_reboot_failed'));
            }
        });
    }

    // Utility Methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showLoading(show) {
        // Could implement a global loading indicator here
    }

    showConfirmDialog(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        const yesBtn = document.getElementById('confirmYes');
        
        if (modal && messageElement) {
            messageElement.textContent = message;
            modal.classList.add('show');
            
            // Remove previous listeners
            const newYesBtn = yesBtn.cloneNode(true);
            yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
            
            // Add new listener
            newYesBtn.addEventListener('click', () => {
                this.closeModal('confirmModal');
                onConfirm();
            });
        }
    }

    showProgressModal(message) {
        const modal = document.getElementById('progressModal');
        const textElement = document.getElementById('progressText');
        
        if (modal && textElement) {
            textElement.textContent = message;
            modal.classList.add('show');
            this.updateProgress(0);
        }
    }

    updateProgress(percent, message = null) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        
        if (message && progressText) {
            progressText.textContent = message;
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    showSuccess(message) {
        alert('✅ ' + message);
    }

    showError(message) {
        alert('❌ ' + message);
    }

    showRebootDialog() {
        const message = this.getTranslation('conversion_complete_reboot');
        this.showConfirmDialog(message, () => {
            this.rebootDevice();
        });
    }

    updateUI() {
        this.translatePage();
        this.updateConvertButton();
        this.updateStatusBar();
    }

    // Mock Data
    getMockUserApps() {
        return [
            {
                packageName: 'com.tencent.mm',
                name: 'WeChat',
                version: '8.0.32',
                size: '150MB'
            },
            {
                packageName: 'com.alibaba.android.rimet',
                name: 'DingTalk',
                version: '6.5.40',
                size: '120MB'
            },
            {
                packageName: 'com.eg.android.AlipayGphone',
                name: 'Alipay',
                version: '10.2.96',
                size: '95MB'
            },
            {
                packageName: 'com.netease.cloudmusic',
                name: 'NetEase Cloud Music',
                version: '8.7.50',
                size: '85MB'
            },
            {
                packageName: 'com.sina.weibo',
                name: 'Weibo',
                version: '12.9.1',
                size: '110MB'
            }
        ];
    }

    getMockSystemApps() {
        return [
            {
                packageName: 'com.android.settings',
                name: 'Settings',
                version: '12.0',
                size: '15MB'
            },
            {
                packageName: 'com.android.systemui',
                name: 'System UI',
                version: '12.0',
                size: '25MB'
            },
            {
                packageName: 'com.android.chrome',
                name: 'Chrome',
                version: '108.0.5359.128',
                size: '180MB'
            }
        ];
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.oukaroManager = new OukaroManager();
});

// Expose for debugging
window.OukaroManager = OukaroManager;
