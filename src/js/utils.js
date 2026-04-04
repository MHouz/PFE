import { state } from './state.js';

// --- Utils ---
export function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' د.م';
}

export function getEntityTotal(entity) {
    if (!entity || !entity.transactions) return 0;
    return entity.transactions.reduce((acc, t) => {
        return t.type === 'debt' ? acc + t.amount : acc - t.amount;
    }, 0);
}

export function getTotalDebts(type) {
    const list = type === 'suppliers' ? state.suppliers : state.clients;
    if (!list || !Array.isArray(list)) return 0;
    return list.reduce((acc, entity) => acc + getEntityTotal(entity), 0);
}

export function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) return 'اليوم';
    if (diff < 172800000) return 'أمس';
    return date.toLocaleDateString('ar-MA');
}
