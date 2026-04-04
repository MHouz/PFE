import { loadFromStorage } from './state.js';
import { 
    render, 
    navigateTo, 
    switchTab, 
    setFilter, 
    setSort, 
    toggleSidebar, 
    saveSettings, 
    openSettings, 
    exportData, 
    triggerImport, 
    handleImport, 
    shareApp, 
    deleteEntity, 
    performDelete, 
    openModal, 
    closeModal, 
    addEntity, 
    addTransaction, 
    handleSearch 
} from './ui.js';

// Attach functions to window for HTML event handlers
window.navigateTo = navigateTo;
window.switchTab = switchTab;
window.setFilter = setFilter;
window.setSort = setSort;
window.toggleSidebar = toggleSidebar;
window.saveSettings = saveSettings;
window.openSettings = openSettings;
window.exportData = exportData;
window.triggerImport = triggerImport;
window.handleImport = handleImport;
window.shareApp = shareApp;
window.deleteEntity = deleteEntity;
window.performDelete = performDelete;
window.openModal = openModal;
window.closeModal = closeModal;
window.addEntity = addEntity;
window.addTransaction = addTransaction;
window.handleSearch = handleSearch;

// --- Initialization ---
window.onload = () => {
    loadFromStorage();
    render();
    
    // Hide intro screen after 2.5 seconds
    setTimeout(() => {
        const intro = document.getElementById('intro-screen');
        if (intro) {
            intro.style.opacity = '0';
            intro.style.visibility = 'hidden';
        }
    }, 2500);
};
