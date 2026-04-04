// --- Data Management ---
export let state = {
    view: 'dashboard', // dashboard, entityDetail
    activeTab: 'clients', // clients, suppliers
    selectedEntityId: null,
    searchQuery: '',
    filterStatus: 'all', // all, debt, paid
    sortBy: 'newest', // newest, oldest, highest, smallest
    clients: [],
    suppliers: [],
    pendingDeleteId: null,
    settings: {
        redLineLimit: 3000,
        darkMode: false
    }
};

export const STORAGE_KEY = 'moul_lhanout_data_v2';

export function setState(newState) {
    state = { ...state, ...newState };
}

export function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const loadedState = JSON.parse(data);
        state = { ...state, ...loadedState };
        // Reset view on load
        state.view = 'dashboard';
        state.selectedEntityId = null;
        state.searchQuery = '';
        state.filterStatus = 'all';
        state.sortBy = 'newest';
        
        // Ensure arrays exist
        if (!state.clients) state.clients = [];
        if (!state.suppliers) state.suppliers = [];
        if (!state.settings) state.settings = { redLineLimit: 3000, darkMode: false };
        
        if (state.settings.darkMode) {
            document.body.classList.add('dark');
        }
    } else {
        seedData();
    }
}

export function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedData() {
    state.clients = [
        {
            id: 'c1',
            name: 'ياسين المنصوري',
            phone: '0612345678',
            transactions: [
                { id: 't1', type: 'debt', label: 'تقدية أسبوعية', amount: 1500, date: new Date(Date.now() - 86400000 * 2).toISOString() },
                { id: 't2', type: 'payment', label: 'دفعة أولى', amount: 250, date: new Date(Date.now() - 86400000).toISOString() }
            ]
        },
        {
            id: 'c2',
            name: 'فاطمة الزهراء',
            phone: '0687654321',
            transactions: [
                { id: 't3', type: 'debt', label: 'زيت وسكر', amount: 450, date: new Date().toISOString() }
            ]
        }
    ];
    state.suppliers = [
        {
            id: 's1',
            name: 'شركة الحليب المركز',
            phone: '0522112233',
            transactions: [
                { id: 'st1', type: 'debt', label: 'سلعة الصباح', amount: 5000, date: new Date().toISOString() }
            ]
        }
    ];
    saveToStorage();
}
