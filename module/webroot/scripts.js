// OukaroManager WebUI Scripts - WebUIX Compatible
// System App Converter for KernelSU with modern Material Design
// Optimized app listing inspired by KOWX712/Tricky-Addon-Update-Target-List
// WebUIX features inspired by KOWX712/ksu-webui-demo
// Original app list optimization by KOWX712 (https://github.com/KOWX712/Tricky-Addon-Update-Target-List)

class OukaroManager {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.userApps = [];
        this.systemApps = [];
        this.convertedApps = [];
        this.selectedApps = new Set();
        this.conversionMode = 'system'; // 'system' or 'priv-app'
        this.currentView = 'list'; // 'list' or 'details'
        this.selectedAppForDetails = null;
        this.appListManager = null;
        this.isWebUIX = this.detectWebUIX();
        
        this.init();
    }

    // WebUIX Detection (inspired by KOWX712)
    detectWebUIX() {
        return !!(window.ksu || window.mmrl || navigator.userAgent.includes('WebUIX'));
    }

    async init() {
        try {
            // WebUIX initialization
            if (this.isWebUIX) {
                console.log('WebUIX environment detected');
                this.setupWebUIXFeatures();
            }

            await this.loadTranslations();
            this.setupEventListeners();
            this.detectLanguage();
            await this.loadInitialData();
            this.updateUI();
            
            // Initialize app list manager (inspired by KOWX712's implementation)
            if (window.appListManager) {
                this.appListManager = window.appListManager;
            }

            // Setup modern interactions
            this.setupRippleEffects();
            this.setupSearchEnhancements();
            
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Failed to initialize application');
        }
    }

    // WebUIX Features Setup (inspired by KOWX712)
    setupWebUIXFeatures() {
        // Theme detection and Monet support
        this.setupThemeDetection();
        
        // Back button handling for WebUIX
        if (window.ksu?.onBackPressed) {
            this.setupBackButtonHandling();
        }

        // Pull-to-refresh support
        // this.setupPullToRefresh(); // Disabled for now, can be re-enabled if needed

        // WebUIX Toast notifications
        this.setupWebUIXToasts();
    }

    setupThemeDetection() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        const updateTheme = (e) => {
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            
            // Update meta theme-color for WebUIX
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', 
                    e.matches ? 'var(--catppuccin-mocha-Base)' : 'var(--catppuccin-latte-Base)'
                );
            }
        };

        prefersDark.addEventListener('change', updateTheme);
        updateTheme(prefersDark);
    }

    setupBackButtonHandling() {
        window.addEventListener('beforeunload', (e) => {
            if (this.currentView === 'details') {
                e.preventDefault();
                this.showListView();
                if (window.ksu?.onBackPressed) {
                    window.ksu.onBackPressed();
                }
            } else if (this.hasUnsavedChanges()) {
                e.preventDefault();
                if (window.ksu?.onBackPressed) {
                    window.ksu.onBackPressed();
                }
            }
        });
    }

    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pullDistance = 0;
        const pullThreshold = 100;
        let isPulling = false;

        const container = document.querySelector('.container');
        if (!container) return;

        container.addEventListener('touchstart', (e) => {
            if (container.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        });

        container.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            pullDistance = currentY - startY;
            
            if (pullDistance > 0 && pullDistance < pullThreshold * 2) {
                e.preventDefault();
                const opacity = Math.min(pullDistance / pullThreshold, 1);
                container.style.transform = `translateY(${pullDistance * 0.5}px)`;
                container.style.opacity = 1 - (opacity * 0.3);
            }
        });

        container.addEventListener('touchend', () => {
            if (isPulling && pullDistance > pullThreshold) {
                this.refreshAppList();
                this.showWebUIXToast('Refreshing apps...', 'info');
            }
            
            container.style.transform = '';
            container.style.opacity = '';
            isPulling = false;
            pullDistance = 0;
        });
    }

    setupWebUIXToasts() {
        if (!document.getElementById('toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    }

    hasUnsavedChanges() {
        return this.selectedApps.size > 0;
    }

    // Modern Ripple Effects (Material Design 3)
    setupRippleEffects() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.btn, .filter-chip, .mode-card');
            if (!button) return;

            this.createRipple(button, e);
        });
    }

    createRipple(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.className = 'btn-ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Enhanced Search with Modern Features
    setupSearchEnhancements() {
        const searchInput = document.getElementById('appSearch');
        const clearButton = document.getElementById('searchClear');
        
        if (!searchInput || !clearButton) return;

        searchInput.addEventListener('input', (e) => {
            const hasValue = e.target.value.length > 0;
            clearButton.style.display = hasValue ? 'flex' : 'none';
            
            // Debounced search
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                if (this.appListManager) {
                    this.appListManager.searchQuery = e.target.value.toLowerCase();
                    this.appListManager.filterAndRenderApps();
                }
            }, 300);
        });

        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            clearButton.style.display = 'none';
            searchInput.focus();
            
            if (this.appListManager) {
                this.appListManager.searchQuery = '';
                this.appListManager.filterAndRenderApps();
            }
        });

        // Search suggestions (future enhancement)
        this.setupSearchSuggestions(searchInput);
    }

    setupSearchSuggestions(searchInput) {
        // Placeholder for future search suggestions implementation
        // Could integrate with WebUIX search features
    }

    // WebUIX Compatible Toast System
    showWebUIXToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            ${icon}
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;"><path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;"><path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;"><path d="M12,2L13.09,8.26L22,9L14.74,15.74L16.32,22L12,18.54L7.68,22L9.26,15.74L2,9L10.91,8.26L12,2Z"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;"><path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>'
        };
        return icons[type] || icons.info;
    }

    // Override toast methods to use WebUIX system
    showSuccess(message) {
        this.showWebUIXToast(message, 'success');
    }

    showError(message) {
        this.showWebUIXToast(message, 'error');
    }

    showWarning(message) {
        this.showWebUIXToast(message, 'warning');
    }

    showInfo(message) {
        this.showWebUIXToast(message, 'info');
    }

    // Enhanced Progress Modal with Modern Design
    showProgress(show, message = 'Processing...', percentage = 0) {
        const modal = document.getElementById('progressModal');
        const text = document.getElementById('progressText');
        const fill = document.getElementById('progressFill');
        const percentageEl = document.getElementById('progressPercentage');
        
        if (!modal) return;

        if (show) {
            if (text) text.textContent = message;
            if (fill) fill.style.width = percentage + '%';
            if (percentageEl) percentageEl.textContent = Math.round(percentage) + '%';
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    updateProgress(percentage, message = null) {
        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');
        const percentageEl = document.getElementById('progressPercentage');
        
        if (fill) fill.style.width = percentage + '%';
        if (percentageEl) percentageEl.textContent = Math.round(percentage) + '%';
        if (message && text) text.textContent = message;
    }

    // Modern Modal System
    showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Close on backdrop click
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop && !options.preventBackdropClose) {
            backdrop.addEventListener('click', () => this.closeModal(modalId), { once: true });
        }

        // ESC key support
        const escHandler = (e) => {
            if (e.key === 'Escape' && !options.preventEscClose) {
                this.closeModal(modalId);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // App List Refresh with WebUIX Integration
    async refreshAppList() {
        if (this.appListManager) {
            await this.appListManager.refreshAppList();
        } else {
            await this.loadInitialData();
        }
        
        this.showWebUIXToast('App list refreshed', 'success');
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
        });        // Translate placeholders
        const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translation = this.getTranslation(key);
            if (translation) {
                element.placeholder = translation;
            }
        });

        // Translate option elements
        const optionElements = document.querySelectorAll('option[data-translate]');
        optionElements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation) {
                element.textContent = translation;
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
    }    changeLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('oukaroLanguage', lang);
            this.translatePage();
            this.updateAppCounts(); // Refresh counts with new language
            
            // Update any dynamic content if app list is loaded
            if (this.appListManager) {
                this.appListManager.refresh();
            }
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Mobile UI Listeners
        this.setupMobileEventListeners();


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

        // Modern action buttons (inspired by KOWX712 design)
        const convertSelectedBtn = document.getElementById('convertSelectedBtn');
        if (convertSelectedBtn) {
            convertSelectedBtn.addEventListener('click', () => this.convertSelectedApps());
        }

        const batchManageBtn = document.getElementById('batchManageBtn');
        if (batchManageBtn) {
            batchManageBtn.addEventListener('click', () => this.showBatchManager());
        }

        const backupBtn = document.getElementById('backupBtn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.createBackup());
        }

        const advancedBtn = document.getElementById('advancedBtn');
        if (advancedBtn) {
            advancedBtn.addEventListener('click', () => this.showAdvancedTools());
        }

        const logViewBtn = document.getElementById('logViewBtn');
        if (logViewBtn) {
            logViewBtn.addEventListener('click', () => this.showLogViewer());
        }

        // Status banner dismiss
        const bannerDismiss = document.querySelector('.banner-dismiss');
        if (bannerDismiss) {
            bannerDismiss.addEventListener('click', () => {
                bannerDismiss.closest('.status-banner').style.display = 'none';
            });
        }

        // Filter chips (modern Material Design)
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                const filter = e.target.dataset.filter;
                if (this.appListManager) {
                    this.appListManager.setFilter(filter);
                }
            });
        });

        // Search improvements
        const appSearch = document.getElementById('appSearch');
        const searchClear = document.getElementById('searchClear');
        if (appSearch && searchClear) {
            appSearch.addEventListener('input', (e) => {
                searchClear.style.display = e.target.value ? 'flex' : 'none';
                if (this.appListManager) {
                    this.appListManager.setSearchQuery(e.target.value);
                }
            });
            
            searchClear.addEventListener('click', () => {
                appSearch.value = '';
                searchClear.style.display = 'none';
                if (this.appListManager) {
                    this.appListManager.setSearchQuery('');
                }
            });
        }

        // Sort functionality
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                if (this.appListManager) {
                    this.appListManager.setSortOption(e.target.value);
                }
            });
        }

        // Selection buttons
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('click', () => {
                if (this.appListManager) {
                    this.appListManager.selectAll();
                }
            });
        }

        const selectNone = document.getElementById('selectNone');
        if (selectNone) {
            selectNone.addEventListener('click', () => {
                if (this.appListManager) {
                    this.appListManager.selectNone();
                }
            });
        }

        // App refresh
        const refreshApps = document.getElementById('refreshApps');
        if (refreshApps) {
            refreshApps.addEventListener('click', () => this.refreshAppList());
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

    setupMobileEventListeners() {
        // Back button in details view
        const backButton = document.querySelector('#details-view .back-button');
        if (backButton) {
            backButton.addEventListener('click', () => this.showListView());
        }

        // Segmented controls
        document.querySelectorAll('.segmented-control').forEach(control => {
            control.addEventListener('click', (e) => {
                const button = e.target.closest('.segmented-option');
                if (button) {
                    // Remove selected from siblings
                    const siblings = control.querySelectorAll('.segmented-option');
                    siblings.forEach(sib => {
                        sib.classList.remove('selected');
                        const icon = sib.querySelector('.selected-icon');
                        if(icon) icon.remove(); // Remove icon from others
                    });

                    // Add selected to current
                    button.classList.add('selected');
                    // Add checkmark icon
                    button.insertAdjacentHTML('afterbegin', `
                        <svg class="selected-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.16251 13.5L2.88751 9.225L3.95626 8.15625L7.16251 11.3625L14.0438 4.48125L15.1125 5.55L7.16251 13.5Z" fill="var(--catppuccin-mocha-Base, #1E1E2E)"/></svg>
                    `);

                    const group = control.closest('.config-section').dataset.group;
                    const value = button.dataset.value;
                    console.log(`Selected ${group}: ${value}`);
                    // Here you would update the app's configuration state
                }
            });
        });

        // Filter labels in list view
        const filterLabels = document.querySelector('.filter-labels');
        if (filterLabels) {
            filterLabels.addEventListener('click', (e) => {
                const button = e.target.closest('.filter-label');
                if (button) {
                    const siblings = filterLabels.querySelectorAll('.filter-label');
                    siblings.forEach(sib => sib.classList.remove('active'));
                    button.classList.add('active');
                    const filter = button.dataset.filter;
                    console.log(`Selected filter: ${filter}`);
                    // Here you would filter the app list
                }
            });
        }

        // Mock app list click to show details
        const appsListContainer = document.querySelector('.apps-list');
        if (appsListContainer) {
            appsListContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.app-card');
                if (card) {
                    const appName = card.querySelector('.app-name').textContent;
                    const appPackage = card.querySelector('.app-package').textContent;
                    this.showDetailsView({ name: appName, packageName: appPackage });
                }
            });
        }
    }

    // View Management
    showListView() {
        document.getElementById('list-view').classList.add('active');
        document.getElementById('details-view').classList.remove('active');
        this.currentView = 'list';
    }

    showDetailsView(app) {
        this.selectedAppForDetails = app;
        
        // Populate details view
        const detailsView = document.getElementById('details-view');
        detailsView.querySelector('.app-name').textContent = app.name;
        detailsView.querySelector('.app-package').textContent = app.packageName;
        // You can also update the icon here if you have it
        // detailsView.querySelector('.app-icon-large').src = app.iconUrl;

        document.getElementById('list-view').classList.remove('active');
        detailsView.classList.add('active');
        this.currentView = 'details';
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
            this.renderMobileAppList(); // Render for mobile view
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError(this.getTranslation('error_load_data'));
        } finally {
            this.showLoading(false);
        }
    }    async loadUserApps() {
        try {
            // Use cached app list generated by service.sh (inspired by KOWX712's optimization)
            const response = await fetch('applist.json');
            if (response.ok) {
                this.userApps = await response.json();
                console.log(`Loaded ${this.userApps.length} user apps from cache`);
            } else {
                // Mock data for demonstration if applist.json is not found
                console.warn('applist.json not found, using mock data.');
                this.userApps = [
                    { name: 'My Awesome App', packageName: 'com.example.awesomeapp', icon: 'assets/favicon.svg' },
                    { name: 'Another Cool App', packageName: 'com.example.coolapp', icon: 'assets/favicon.svg' },
                    { name: 'Productivity Pro', packageName: 'com.example.prodpro', icon: 'assets/favicon.svg' },
                ];
            }
        } catch (error) {
            console.warn('Failed to load cached user apps, using fallback:', error);
            this.userApps = this.getMockUserApps();
        }
        
        // Update the app list display if manager is available
        if (this.appListManager) {
            this.appListManager.userApps = this.userApps;
            this.appListManager.filterAndRenderApps();
        }
    }

    async loadSystemApps() {
        try {
            // Use cached system app list
            const response = await fetch('systemlist.json');
            if (response.ok) {
                this.systemApps = await response.json();
                console.log(`Loaded ${this.systemApps.length} system apps from cache`);
            } else {
                throw new Error('Failed to load cached system app list');
            }
        } catch (error) {
            console.warn('Failed to load cached system apps, using fallback:', error);
            this.systemApps = this.getMockSystemApps();
        }
        
        // Update the app list display if manager is available
        if (this.appListManager) {
            this.appListManager.systemApps = this.systemApps;
            this.appListManager.filterAndRenderApps();
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
    renderMobileAppList() {
        const listElement = document.querySelector('#list-view .apps-list');
        if (!listElement) return;

        if (!this.userApps || this.userApps.length === 0) {
            listElement.innerHTML = `<p>No applications found.</p>`;
            return;
        }

        const appCardsHTML = this.userApps.map(app => `
            <div class="app-card" data-package="${app.packageName}">
                <img src="${app.icon || 'assets/favicon.svg'}" alt="App Icon" class="app-icon">
                <div class="app-info">
                    <div class="app-name">${app.name}</div>
                    <div class="app-package">${app.packageName}</div>
                </div>
            </div>
        `).join('');

        listElement.innerHTML = appCardsHTML;
    }

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
        const selectedApps = this.appListManager?.getSelectedApps() || [];
        
        if (selectedApps.length === 0) {
            this.showError(this.getTranslation('error_no_apps_selected') || 'No apps selected');
            return;
        }

        const mode = this.conversionMode;
        const modeText = mode === 'system' ? '/system/app/' : '/system/priv-app/';
        
        const confirmMessage = `Convert ${selectedApps.length} app(s) to ${modeText}?\n\nThis will require a device reboot to take effect.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        this.showProgress(true, 'Converting applications...');
        
        try {
            let successCount = 0;
            let errors = [];
            
            for (let i = 0; i < selectedApps.length; i++) {
                const app = selectedApps[i];
                const progress = ((i + 1) / selectedApps.length) * 100;
                
                this.updateProgress(progress, `Converting ${app.app_name}...`);
                
                try {
                    await this.convertSingleApp(app, mode);
                    successCount++;
                    
                    // Add to converted apps list
                    const convertedApp = {
                        ...app,
                        conversion_mode: mode,
                        converted_at: new Date().toISOString()
                    };
                    
                    this.convertedApps.push(convertedApp);
                    
                    // Remove from selected apps
                    this.selectedApps.delete(app.package_name);
                    
                } catch (error) {
                    console.error(`Failed to convert ${app.package_name}:`, error);
                    errors.push(`${app.app_name}: ${error.message}`);
                }
                
                // Small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // Save converted apps to localStorage
            localStorage.setItem('oukaroConvertedApps', JSON.stringify(this.convertedApps));
            
            this.showProgress(false);
            
            if (successCount > 0) {
                this.showSuccess(`Successfully converted ${successCount} app(s). Please reboot your device for changes to take effect.`);
                
                // Update UI
                if (this.appListManager) {
                    this.appListManager.convertedApps = this.convertedApps;
                    this.appListManager.filterAndRenderApps();
                    this.appListManager.updateSelectionCount();
                }
                
                this.updateStatusBar();
            }
            
            if (errors.length > 0) {
                this.showError(`Some conversions failed:\n${errors.join('\n')}`);
            }
            
        } catch (error) {
            this.showProgress(false);
            this.showError(`Conversion failed: ${error.message}`);
        }
    }

    async convertSingleApp(app, mode) {
        // Create conversion record for service.sh to process
        const conversionRecord = `${app.package_name}|${mode}|${app.app_name.replace(/[^a-zA-Z0-9]/g, '_')}|${app.apk_path}`;
        
        // In a real implementation, this would call a backend API
        // For now, we'll simulate the conversion process
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success/failure
                if (Math.random() > 0.1) { // 90% success rate
                    resolve();
                } else {
                    reject(new Error('Conversion failed'));
                }
            }, Math.random() * 1000 + 500);
        });
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
                this.showSuccess(this.getTranslation('app_reverted').replace('{app}', app.name));
            } catch (error) {
                this.showError(this.getTranslation('error_revert_app').replace('{app}', app.name));
            }
        });
    }

    async revertAllApps() {
        if (this.convertedApps.length === 0) {
            this.showError(this.getTranslation('error_no_converted_apps'));
            return;
        }

        const confirmMessage = this.getTranslation('confirm_revert_all');
        this.showConfirmDialog(confirmMessage, async () => {
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

                // Clear converted apps
                this.convertedApps = [];
                localStorage.removeItem('oukaroConvertedApps');

                this.renderAppsList('converted', this.convertedApps);
                this.renderAppsList('user', this.userApps);
                this.updateStatusBar();
                this.showSuccess(this.getTranslation('all_apps_reverted'));
            } catch (error) {
                this.showError(this.getTranslation('error_revert_all'));
            }
        });
    }

    // Utility Functions
    showLoading(show) {
        const loadingElement = document.querySelector('.webuix-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
        const container = document.querySelector('.container');
        if (container) {
            container.style.opacity = show ? '0' : '1';
        }
    }

    showConfirmDialog(message, onConfirm) {
        const confirmModal = document.getElementById('confirmModal');
        const confirmText = document.getElementById('confirmText');
        const confirmYes = document.getElementById('confirmYes');

        if (confirmModal && confirmText && confirmYes) {
            confirmText.textContent = message;
            
            const confirmHandler = () => {
                onConfirm();
                this.closeModal('confirmModal');
                confirmYes.removeEventListener('click', confirmHandler);
            };
            
            confirmYes.addEventListener('click', confirmHandler);
            this.showModal('confirmModal');
        } else {
            // Fallback for simple browsers
            if (confirm(message)) {
                onConfirm();
            }
        }
    }

    async refreshData() {
        this.showInfo('Refreshing data...');
        await this.loadInitialData();
        this.showSuccess('Data refreshed successfully');
    }

    rebootDevice() {
        if (confirm(this.getTranslation('confirm_reboot'))) {
            console.log('Rebooting device...');
            // In a real implementation, this would call a backend API
            this.showInfo('Reboot command sent.');
        }
    }

    // Mock data for testing without backend
    getMockUserApps() {
        return [
            { name: 'Mock App 1', packageName: 'com.mock.app1', version: '1.0', size: '12MB', icon: 'assets/favicon.svg' },
            { name: 'Mock App 2', packageName: 'com.mock.app2', version: '2.1', size: '25MB', icon: 'assets/favicon.svg' }
        ];
    }

    getMockSystemApps() {
        return [
            { name: 'Mock System App', packageName: 'com.mock.system', version: '1.0', size: '5MB', icon: 'assets/favicon.svg' }
        ];
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.oukaroManager = new OukaroManager();
});
 (container) {
            container.style.opacity = show ? '0' : '1';
        }
    }
