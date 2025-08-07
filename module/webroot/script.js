// Oukaro Manager - WebUI JavaScript
class OukaroManager {
    constructor() {
        this.apps = [];
        this.filteredApps = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadApps();
        this.updateStats();
        this.renderApps();
    }
    
    setupEventListeners() {
        // 搜索框事件
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndRenderApps();
        });
        
        // 过滤按钮事件
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 移除其他按钮的active类
                filterBtns.forEach(b => b.classList.remove('active'));
                // 添加当前按钮的active类
                e.target.classList.add('active');
                
                this.currentFilter = e.target.dataset.filter;
                this.filterAndRenderApps();
            });
        });
    }
    
    async loadApps() {
        try {
            this.log('📡 正在加载应用数据...');
            
            // 模拟加载延迟
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 尝试从KernelSU API加载数据
            if (typeof ksu !== 'undefined' && ksu.mmrl) {
                try {
                    const result = await ksu.mmrl.action('get_apps', {});
                    if (result && result.apps) {
                        this.apps = result.apps;
                    } else {
                        await this.loadMockData();
                    }
                } catch (error) {
                    this.log('⚠️ KernelSU API调用失败，使用模拟数据');
                    await this.loadMockData();
                }
            } else {
                this.log('⚠️ KernelSU环境未检测到，使用模拟数据');
                await this.loadMockData();
            }
            
            this.log(`✅ 已加载 ${this.apps.length} 个应用`);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('appsList').style.display = 'block';
            
        } catch (error) {
            this.log(`❌ 加载失败: ${error.message}`);
            await this.loadMockData();
        }
    }
    
    async loadMockData() {
        // 模拟数据用于演示
        this.apps = [
            {
                package: 'com.tencent.mm',
                label: '微信',
                sourceDir: '/data/app/com.tencent.mm-1/base.apk',
                installType: 'user',
                permissionMode: 'user',
                targetPath: ''
            },
            {
                package: 'com.alibaba.android.rimet',
                label: '钉钉',
                sourceDir: '/data/app/com.alibaba.android.rimet-2/base.apk',
                installType: 'user',
                permissionMode: 'system',
                targetPath: '/system/app/com.alibaba.android.rimet'
            },
            {
                package: 'com.taobao.taobao',
                label: '手机淘宝',
                sourceDir: '/data/app/com.taobao.taobao-3/base.apk',
                installType: 'user',
                permissionMode: 'priv',
                targetPath: '/system/priv-app/com.taobao.taobao'
            },
            {
                package: 'com.example.testapp',
                label: '测试应用',
                sourceDir: '/data/app/com.example.testapp-4/base.apk',
                installType: 'user',
                permissionMode: 'user',
                targetPath: ''
            }
        ];
    }
    
    filterAndRenderApps() {
        // 应用过滤逻辑
        this.filteredApps = this.apps.filter(app => {
            // 按类型过滤
            if (this.currentFilter !== 'all' && app.permissionMode !== this.currentFilter) {
                return false;
            }
            
            // 按搜索词过滤
            if (this.searchTerm) {
                const searchMatch = app.label.toLowerCase().includes(this.searchTerm) ||
                                  app.package.toLowerCase().includes(this.searchTerm);
                if (!searchMatch) return false;
            }
            
            return true;
        });
        
        this.renderApps();
    }
    
    renderApps() {
        const container = document.getElementById('appsList');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredApps.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'block';
        emptyState.style.display = 'none';
        
        container.innerHTML = this.filteredApps.map(app => this.renderAppCard(app)).join('');
    }
    
    renderAppCard(app) {
        const statusClass = `status-${app.permissionMode}`;
        const statusText = {
            'user': '用户应用',
            'system': '系统应用', 
            'priv': '特权应用'
        }[app.permissionMode] || '未知';
        
        const isMounted = app.targetPath && app.targetPath.length > 0;
        
        return `
            <div class="app-card webui-x-card">
                <div class="app-info">
                    <div class="app-details">
                        <h4>${app.label}</h4>
                        <p>${app.package}</p>
                        <p style="font-size: 10px; color: #999;">${app.sourceDir}</p>
                    </div>
                    <div class="app-status">
                        <div class="status-badge ${statusClass}">${statusText}</div>
                        <div class="action-buttons">
                            ${this.renderActionButtons(app, isMounted)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderActionButtons(app, isMounted) {
        if (isMounted) {
            return `<button class="btn-small btn-unmount" onclick="oukaroManager.unmountApp('${app.package}')">卸载</button>`;
        } else {
            return `
                <button class="btn-small btn-system" onclick="oukaroManager.mountApp('${app.package}', 'system')">挂载到系统</button>
                <button class="btn-small btn-priv" onclick="oukaroManager.mountApp('${app.package}', 'priv')">挂载到特权</button>
            `;
        }
    }
    
    async mountApp(packageName, targetType) {
        try {
            this.log(`🔄 正在将 ${packageName} 挂载为 ${targetType} 应用...`);
            
            // 调用KernelSU API或模拟操作
            if (typeof ksu !== 'undefined' && ksu.mmrl) {
                const result = await ksu.mmrl.action('mount_app', {
                    package: packageName,
                    target: targetType
                });
                
                if (result && result.success) {
                    this.log(`✅ ${packageName} 已成功挂载为 ${targetType} 应用`);
                } else {
                    throw new Error(result.error || '挂载失败');
                }
            } else {
                // 模拟操作
                await new Promise(resolve => setTimeout(resolve, 2000));
                this.log(`✅ [模拟] ${packageName} 已成功挂载为 ${targetType} 应用`);
            }
            
            // 更新应用状态
            const app = this.apps.find(a => a.package === packageName);
            if (app) {
                app.permissionMode = targetType;
                app.targetPath = targetType === 'system' ? 
                    `/system/app/${packageName}` : 
                    `/system/priv-app/${packageName}`;
            }
            
            this.updateStats();
            this.filterAndRenderApps();
            
        } catch (error) {
            this.log(`❌ 挂载失败: ${error.message}`);
        }
    }
    
    async unmountApp(packageName) {
        try {
            this.log(`🔄 正在卸载 ${packageName}...`);
            
            // 调用KernelSU API或模拟操作
            if (typeof ksu !== 'undefined' && ksu.mmrl) {
                const result = await ksu.mmrl.action('unmount_app', {
                    package: packageName
                });
                
                if (result && result.success) {
                    this.log(`✅ ${packageName} 已成功卸载`);
                } else {
                    throw new Error(result.error || '卸载失败');
                }
            } else {
                // 模拟操作
                await new Promise(resolve => setTimeout(resolve, 1500));
                this.log(`✅ [模拟] ${packageName} 已成功卸载`);
            }
            
            // 更新应用状态
            const app = this.apps.find(a => a.package === packageName);
            if (app) {
                app.permissionMode = 'user';
                app.targetPath = '';
            }
            
            this.updateStats();
            this.filterAndRenderApps();
            
        } catch (error) {
            this.log(`❌ 卸载失败: ${error.message}`);
        }
    }
    
    updateStats() {
        const stats = {
            total: this.apps.length,
            user: this.apps.filter(app => app.permissionMode === 'user').length,
            system: this.apps.filter(app => app.permissionMode === 'system').length,
            priv: this.apps.filter(app => app.permissionMode === 'priv').length
        };
        
        document.getElementById('totalApps').textContent = stats.total;
        document.getElementById('userApps').textContent = stats.user;
        document.getElementById('systemApps').textContent = stats.system;
        document.getElementById('privApps').textContent = stats.priv;
    }
    
    log(message) {
        const logContainer = document.getElementById('logContainer');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        console.log(message);
    }
}

// 初始化应用
let oukaroManager;
document.addEventListener('DOMContentLoaded', () => {
    oukaroManager = new OukaroManager();
});

// KernelSU WebUI接口兼容性
if (typeof window.kernelsu !== 'undefined') {
    window.kernelsu.onPageFinished = () => {
        oukaroManager = new OukaroManager();
    };
}
