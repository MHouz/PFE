import { state, saveToStorage, setState } from './state.js';
import { formatCurrency, getEntityTotal, getTotalDebts, formatDate } from './utils.js';

// --- Navigation & UI Actions ---
export function navigateTo(view, entityId = null) {
    state.view = view;
    state.selectedEntityId = entityId;
    render();
}

export function switchTab(tab) {
    state.activeTab = tab;
    state.searchQuery = '';
    state.filterStatus = 'all';
    render();
}

export function setFilter(status) {
    state.filterStatus = status;
    render();
}

export function setSort(sort) {
    state.sortBy = sort;
    closeModal();
    render();
}

export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isHidden = sidebar.classList.contains('-translate-x-full');
    
    if (isHidden) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

export function saveSettings() {
    const limit = document.getElementById('setting-red-line').value;
    state.settings.redLineLimit = parseFloat(limit) || 3000;
    state.settings.darkMode = document.getElementById('setting-dark-mode').checked;
    
    if (state.settings.darkMode) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
    
    saveToStorage();
    closeModal();
    render();
}

export function openSettings() {
    toggleSidebar();
    openModal('settings');
}

export function exportData() {
    const dataStr = JSON.stringify(state);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `moul_lhanout_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

export function triggerImport() {
    document.getElementById('import-file').click();
}

export function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState.clients && Array.isArray(importedState.clients)) {
                setState(importedState);
                saveToStorage();
                render();
                openModal('alert', 'تم استيراد البيانات بنجاح');
            } else {
                openModal('alert', 'ملف غير صالح');
            }
        } catch (err) {
            openModal('alert', 'خطأ في قراءة الملف');
        }
    };
    reader.readAsText(file);
}

export function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'مول الحانوت',
            text: 'تطبيق تتبع ديون الزبناء - مول الحانوت',
            url: window.location.href
        }).catch(err => {
            console.error(err);
            openModal('alert', 'خطأ في المشاركة');
        });
    } else {
        openModal('alert', 'المشاركة غير مدعومة في هذا المتصفح. يمكنك نسخ الرابط: ' + window.location.href);
    }
}

export function deleteEntity(entityId) {
    state.pendingDeleteId = entityId;
    openModal('confirmDelete');
}

export function performDelete() {
    const entityId = state.pendingDeleteId;
    const type = state.activeTab;
    if (type === 'suppliers') {
        state.suppliers = state.suppliers.filter(s => s.id !== entityId);
    } else {
        state.clients = state.clients.filter(c => c.id !== entityId);
    }
    saveToStorage();
    state.pendingDeleteId = null;
    closeModal();
    navigateTo('dashboard');
}

export function openModal(type, data = null) {
    const container = document.getElementById('modal-container');
    container.classList.remove('hidden');
    
    let content = '';
    const entityType = state.activeTab === 'suppliers' ? 'مورد' : 'زبون';
    if (type === 'newClient') {
        content = `
            <div class="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
                <h3 class="text-lg font-bold text-primary mb-4 text-center">إضافة ${entityType} جديد</h3>
                <div class="space-y-4">
                    <input type="text" id="new-entity-name" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary" placeholder="الاسم">
                    <input type="tel" id="new-entity-phone" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary" placeholder="رقم الهاتف">
                    <div class="flex gap-3 pt-2">
                        <button onclick="closeModal()" class="flex-1 py-3 text-gray-500 font-bold">إلغاء</button>
                        <button onclick="addEntity()" class="flex-1 bg-primary text-white py-3 rounded-xl font-bold">تأكيد</button>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'settings') {
        content = `
            <div class="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
                <h3 class="text-lg font-bold text-primary mb-4 text-center">الإعدادات</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-400 mb-1">حد التنبيه (الخط الأحمر)</label>
                        <input type="number" id="setting-red-line" value="${state.settings.redLineLimit}" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary">
                    </div>
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span class="text-sm font-bold text-primary">الوضع الليلي</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="setting-dark-mode" ${state.settings.darkMode ? 'checked' : ''} class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                        </label>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="exportData()" class="p-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex flex-col items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            تصدير JSON
                        </button>
                        <button onclick="triggerImport()" class="p-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex flex-col items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            استيراد JSON
                        </button>
                    </div>
                    <button onclick="shareApp()" class="w-full p-3 bg-secondary/10 text-secondary rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        مشاركة التطبيق
                    </button>
                    <div class="flex gap-3 pt-2">
                        <button onclick="closeModal()" class="flex-1 py-3 text-gray-500 font-bold">إلغاء</button>
                        <button onclick="saveSettings()" class="flex-1 bg-primary text-white py-3 rounded-xl font-bold">حفظ</button>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'addDebt') {
        content = `
            <div class="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
                <h3 class="text-lg font-bold text-primary mb-4 text-center">إضافة دين جديد</h3>
                <div class="space-y-4">
                    <input type="text" id="trans-label" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary" placeholder="بيان (مثلا: تقدية)">
                    <input type="number" id="trans-amount" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary" placeholder="المبلغ">
                    <div class="flex gap-3 pt-2">
                        <button onclick="closeModal()" class="flex-1 py-3 text-gray-500 font-bold">إلغاء</button>
                        <button onclick="addTransaction('debt')" class="flex-1 bg-tertiary text-white py-3 rounded-xl font-bold">إضافة</button>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'addPayment') {
        content = `
            <div class="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
                <h3 class="text-lg font-bold text-primary mb-4 text-center">تسجيل أداء</h3>
                <div class="space-y-4">
                    <input type="number" id="trans-amount" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary" placeholder="المبلغ المؤدى">
                    <div class="flex gap-3 pt-2">
                        <button onclick="closeModal()" class="flex-1 py-3 text-gray-500 font-bold">إلغاء</button>
                        <button onclick="addTransaction('payment')" class="flex-1 bg-secondary text-white py-3 rounded-xl font-bold">تسجيل</button>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'confirmDelete') {
        const entityType = state.activeTab === 'suppliers' ? 'مورد' : 'زبون';
        content = `
            <div class="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
                <h3 class="text-lg font-bold text-primary mb-4 text-center">حذف ${entityType}</h3>
                <p class="text-sm text-gray-500 text-center mb-6">هل أنت متأكد من حذف هذا ال${entityType}؟ سيتم مسح جميع معاملاته نهائياً.</p>
                <div class="flex gap-3">
                    <button onclick="closeModal()" class="flex-1 py-3 text-gray-500 font-bold">إلغاء</button>
                    <button onclick="performDelete()" class="flex-1 bg-tertiary text-white py-3 rounded-xl font-bold">حذف نهائي</button>
                </div>
            </div>
        `;
    } else if (type === 'sortMenu') {
        content = `
            <div class="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
                <h3 class="text-lg font-bold text-primary mb-4 text-center">ترتيب وحسب</h3>
                <div class="space-y-2">
                    <button onclick="setSort('newest')" class="w-full p-4 rounded-xl flex items-center justify-between ${state.sortBy === 'newest' ? 'bg-secondary/10 text-secondary' : 'hover:bg-gray-50 text-primary'}">
                        <span class="font-bold">الأحدث أولاً</span>
                        ${state.sortBy === 'newest' ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>' : ''}
                    </button>
                    <button onclick="setSort('oldest')" class="w-full p-4 rounded-xl flex items-center justify-between ${state.sortBy === 'oldest' ? 'bg-secondary/10 text-secondary' : 'hover:bg-gray-50 text-primary'}">
                        <span class="font-bold">الأقدم أولاً</span>
                        ${state.sortBy === 'oldest' ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>' : ''}
                    </button>
                    <button onclick="setSort('highest')" class="w-full p-4 rounded-xl flex items-center justify-between ${state.sortBy === 'highest' ? 'bg-secondary/10 text-secondary' : 'hover:bg-gray-50 text-primary'}">
                        <span class="font-bold">الأعلى ديناً</span>
                        ${state.sortBy === 'highest' ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>' : ''}
                    </button>
                    <button onclick="setSort('smallest')" class="w-full p-4 rounded-xl flex items-center justify-between ${state.sortBy === 'smallest' ? 'bg-secondary/10 text-secondary' : 'hover:bg-gray-50 text-primary'}">
                        <span class="font-bold">الأقل ديناً</span>
                        ${state.sortBy === 'smallest' ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>' : ''}
                    </button>
                    <div class="pt-4 border-t border-gray-100 mt-2">
                        <p class="text-[10px] text-gray-400 mb-2 px-2">تصفية حسب الحالة</p>
                        <div class="flex gap-2">
                            <button onclick="setFilter('all'); closeModal()" class="flex-1 py-2 rounded-lg text-xs font-bold ${state.filterStatus === 'all' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}">الكل</button>
                            <button onclick="setFilter('debt'); closeModal()" class="flex-1 py-2 rounded-lg text-xs font-bold ${state.filterStatus === 'debt' ? 'bg-tertiary text-white' : 'bg-gray-50 text-gray-400'}">عليهم ديون</button>
                            <button onclick="setFilter('paid'); closeModal()" class="flex-1 py-2 rounded-lg text-xs font-bold ${state.filterStatus === 'paid' ? 'bg-secondary text-white' : 'bg-gray-50 text-gray-400'}">خالصين</button>
                        </div>
                    </div>
                    <button onclick="closeModal()" class="w-full mt-4 py-3 text-gray-500 font-bold">إغلاق</button>
                </div>
            </div>
        `;
    } else if (type === 'alert') {
        content = `
            <div class="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
                <h3 class="text-lg font-bold text-primary mb-4 text-center">تنبيه</h3>
                <p class="text-sm text-gray-500 text-center mb-6">${data}</p>
                <button onclick="closeModal()" class="w-full bg-primary text-white py-3 rounded-xl font-bold">حسناً</button>
            </div>
        `;
    }
    
    container.innerHTML = content;
}

export function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

export function addEntity() {
    const name = document.getElementById('new-entity-name').value;
    const phone = document.getElementById('new-entity-phone').value;
    if (!name) return;
    
    const newEntity = {
        id: (state.activeTab === 'suppliers' ? 's' : 'c') + Date.now().toString(),
        name,
        phone,
        transactions: []
    };
    
    if (state.activeTab === 'suppliers') {
        state.suppliers.unshift(newEntity);
    } else {
        state.clients.unshift(newEntity);
    }
    saveToStorage();
    closeModal();
    render();
}

export function addTransaction(type) {
    const amount = parseFloat(document.getElementById('trans-amount').value);
    const label = document.getElementById('trans-label')?.value || (type === 'payment' ? 'أداء' : 'دين');
    
    if (isNaN(amount) || amount <= 0) return;
    
    const list = state.activeTab === 'suppliers' ? state.suppliers : state.clients;
    const entity = list.find(e => e.id === state.selectedEntityId);
    if (!entity) return;
    
    entity.transactions.unshift({
        id: Date.now().toString(),
        type,
        label,
        amount,
        date: new Date().toISOString()
    });
    
    saveToStorage();
    closeModal();
    render();
}

export function handleSearch(e) {
    state.searchQuery = e.target.value;
    renderEntityList();
}

// --- Rendering Functions ---
export function render() {
    const app = document.getElementById('app');
    if (state.view === 'dashboard') {
        renderDashboard(app);
    } else if (state.view === 'entityDetail') {
        renderEntityDetail(app);
    }
}

export function renderDashboard(container) {
    const isSuppliers = state.activeTab === 'suppliers';
    const entityType = isSuppliers ? 'مورد' : 'زبون';
    const totalDebts = getTotalDebts(state.activeTab);

    container.innerHTML = `
        <!-- Top Bar -->
        <div class="p-6 flex justify-between items-center">
            <h1 class="text-2xl font-black text-primary">مول الحانوت</h1>
            <button onclick="toggleSidebar()" class="p-2 bg-white rounded-xl shadow-sm text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            </button>
        </div>

        <!-- Search & Filter -->
        <div class="px-6 mb-6">
            <div class="flex gap-3 items-center">
                <button onclick="openModal('sortMenu')" class="p-4 bg-white rounded-2xl shadow-sm text-primary active:scale-95 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                </button>
                <div class="relative flex-1">
                    <input type="text" oninput="handleSearch(event)" value="${state.searchQuery}" placeholder="ابحث عن ${entityType}" class="w-full p-4 pr-12 bg-white rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-secondary/20 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
        </div>

        <!-- Hero Card -->
        <div class="px-6 mb-8">
            <div class="hero-gradient rounded-[32px] p-8 text-white shadow-xl">
                <p class="text-secondary font-medium mb-2 opacity-80">${isSuppliers ? 'مجموع ما علي للموردين' : 'مجموع الديون على الزبناء'}</p>
                <div class="flex items-baseline gap-2">
                    <h2 class="text-4xl font-bold">${formatCurrency(totalDebts).split(' ')[0]}</h2>
                    <span class="text-lg opacity-60">د.م</span>
                </div>
            </div>
        </div>

        <!-- List Header -->
        <div class="px-6 mb-4 flex justify-between items-center">
            <h3 class="text-lg font-bold text-primary">قائمة ${isSuppliers ? 'الموردين' : 'الزبناء'}</h3>
            <span class="px-3 py-1 bg-indigo-50 text-indigo-500 text-xs font-bold rounded-full">${isSuppliers ? state.suppliers.length : state.clients.length} ${entityType}</span>
        </div>

        <!-- Entity List -->
        <div id="entity-list" class="flex-1 overflow-y-auto px-6 no-scrollbar space-y-4 customers-list">
            <!-- List items injected here -->
        </div>

        <!-- Floating Action Button -->
        <button onclick="openModal('newClient')" class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-2 font-bold z-30 active:scale-95 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            <span>${entityType} جديد</span>
        </button>

        <!-- Bottom Nav -->
        <div class="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-around px-6 z-20">
            <button onclick="switchTab('clients')" class="flex flex-col items-center gap-1 ${!isSuppliers ? 'text-secondary' : 'text-gray-300'}">
                <div class="p-2 ${!isSuppliers ? 'bg-secondary/10' : ''} rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="${!isSuppliers ? 'currentColor' : 'none'}" viewBox="${!isSuppliers ? '0 0 20 20' : '0 0 24 24'}" stroke="${!isSuppliers ? 'none' : 'currentColor'}">
                        ${!isSuppliers ? 
                            '<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />' :
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />'
                        }
                    </svg>
                </div>
                <span class="text-[10px] font-bold">الزبناء</span>
            </button>
            <button onclick="switchTab('suppliers')" class="flex flex-col items-center gap-1 ${isSuppliers ? 'text-secondary' : 'text-gray-300'}">
                <div class="p-2 ${isSuppliers ? 'bg-secondary/10' : ''} rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="${isSuppliers ? 'currentColor' : 'none'}" viewBox="${isSuppliers ? '0 0 20 20' : '0 0 24 24'}" stroke="${isSuppliers ? 'none' : 'currentColor'}">
                        ${isSuppliers ?
                            '<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />' :
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />'
                        }
                    </svg>
                </div>
                <span class="text-[10px] font-bold">الموردون</span>
            </button>
        </div>
    `;
    renderEntityList();
}

export function renderEntityList() {
    const listContainer = document.getElementById('entity-list');
    if (!listContainer) return;

    const list = state.activeTab === 'suppliers' ? state.suppliers : state.clients;
    
    let filtered = list.filter(e => 
        e.name.toLowerCase().includes(state.searchQuery.toLowerCase())
    );

    if (state.filterStatus === 'debt') {
        filtered = filtered.filter(e => getEntityTotal(e) > 0);
    } else if (state.filterStatus === 'paid') {
        filtered = filtered.filter(e => getEntityTotal(e) === 0);
    }

    // Sorting
    filtered.sort((a, b) => {
        const totalA = getEntityTotal(a);
        const totalB = getEntityTotal(b);
        const dateA = a.transactions[0] ? new Date(a.transactions[0].date).getTime() : 0;
        const dateB = b.transactions[0] ? new Date(b.transactions[0].date).getTime() : 0;

        if (state.sortBy === 'newest') return dateB - dateA;
        if (state.sortBy === 'oldest') return dateA - dateB;
        if (state.sortBy === 'highest') return totalB - totalA;
        if (state.sortBy === 'smallest') return totalA - totalB;
        return 0;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 opacity-30">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p class="font-bold">لا يوجد نتائج</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filtered.map(entity => {
        const total = getEntityTotal(entity);
        const lastTrans = entity.transactions[0];
        const statusColor = total >= state.settings.redLineLimit ? 'text-tertiary' : (total === 0 ? 'text-secondary' : 'text-primary');
        
        return `
            <div onclick="navigateTo('entityDetail', '${entity.id}')" class="bg-white p-4 rounded-2xl custom-shadow flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer">
                <div class="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-primary">${entity.name}</h4>
                    <p class="text-xs text-gray-400">${lastTrans ? lastTrans.label + ' • ' + formatDate(lastTrans.date) : 'لا توجد معاملات'}</p>
                </div>
                <div class="text-left">
                    <p class="font-bold ${statusColor}">${formatCurrency(total).split(' ')[0]}</p>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-200 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
            </div>
        `;
    }).join('');
}

export function renderEntityDetail(container) {
    const list = state.activeTab === 'suppliers' ? state.suppliers : state.clients;
    const entity = list.find(e => e.id === state.selectedEntityId);
    if (!entity) {
        navigateTo('dashboard');
        return;
    }

    const total = getEntityTotal(entity);
    const statusColor = total >= state.settings.redLineLimit ? 'text-tertiary' : (total === 0 ? 'text-secondary' : 'text-primary');
    const entityTypeLabel = state.activeTab === 'suppliers' ? 'المورد' : 'الزبون';

    container.innerHTML = `
        <!-- Header -->
        <div class="p-6 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <button onclick="navigateTo('dashboard')" class="p-2 bg-white rounded-xl shadow-sm text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
                <h1 class="text-xl font-bold text-primary">تفاصيل ${entityTypeLabel}</h1>
            </div>
            <button onclick="deleteEntity('${entity.id}')" class="p-2 text-tertiary hover:bg-tertiary/10 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>

        <!-- Entity Info Card -->
        <div class="px-6 mb-8">
            <div class="bg-white rounded-[32px] p-8 shadow-xl text-center">
                <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <h2 class="text-2xl font-black text-primary mb-1">${entity.name}</h2>
                <p class="text-gray-400 text-sm mb-4">${entity.phone || 'بدون رقم هاتف'}</p>
                <div class="pt-4 border-t border-gray-50">
                    <p class="text-xs text-gray-400 mb-1">إجمالي الرصيد</p>
                    <p class="text-3xl font-black ${statusColor}">${formatCurrency(total)}</p>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="px-6 mb-8 flex gap-4">
            <button onclick="openModal('addDebt')" class="flex-1 bg-tertiary text-white py-4 rounded-2xl font-bold shadow-lg shadow-tertiary/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                <span>إضافة دين</span>
            </button>
            <button onclick="openModal('addPayment')" class="flex-1 bg-secondary text-white py-4 rounded-2xl font-bold shadow-lg shadow-secondary/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span>تسجيل أداء</span>
            </button>
        </div>

        <!-- Transactions Header -->
        <div class="px-6 mb-4">
            <h3 class="text-lg font-bold text-primary">سجل المعاملات</h3>
        </div>

        <!-- Transactions List -->
        <div class="flex-1 overflow-y-auto px-6 no-scrollbar space-y-3 transactions-list">
            ${entity.transactions.length === 0 ? `
                <div class="text-center py-12 opacity-20">
                    <p class="font-bold">لا توجد معاملات بعد</p>
                </div>
            ` : entity.transactions.map(t => `
                <div class="bg-white p-4 rounded-2xl custom-shadow flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'debt' ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}">
                            ${t.type === 'debt' ? 
                                '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>' : 
                                '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
                            }
                        </div>
                        <div>
                            <p class="font-bold text-sm text-primary">${t.label}</p>
                            <p class="text-[10px] text-gray-400">${new Date(t.date).toLocaleString('ar-MA')}</p>
                        </div>
                    </div>
                    <div class="text-left">
                        <p class="font-black ${t.type === 'debt' ? 'text-tertiary' : 'text-secondary'}">${t.type === 'debt' ? '+' : '-'}${t.amount.toFixed(2)}</p>
                        <span class="text-[8px] font-bold px-2 py-0.5 rounded-full ${t.type === 'debt' ? 'bg-tertiary/5 text-tertiary' : 'bg-secondary/5 text-secondary'}">
                            ${t.type === 'debt' ? 'دين' : 'أداء'}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
