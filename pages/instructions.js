import { getIsMobile, updateIsMobile } from '../js/globals.js';
import i18n from '../js/i18n.js';

// Función para actualizar el layout
function updateLayout() {
    const isMobile = getIsMobile();
    console.log('Updating layout for mobile:', isMobile);
    document.body.classList.toggle('mobile-layout', isMobile);
    document.body.classList.toggle('desktop-layout', !isMobile);

    // Orientación
    const isHorizontal = window.innerWidth > window.innerHeight;
    document.body.classList.toggle('is-horizontal', isHorizontal);
    document.body.classList.toggle('is-vertical', !isHorizontal);
}

// Inicializar traducciones
(async () => {
    try {
        const response = await fetch('../settings/activities.json');
        if (response.ok) {
            const data = await response.json();
            const language = data.general?.language || 'en';
            console.log('Loading language:', language);
            await i18n.init(language);
            i18n.applyTranslations();
            console.log('i18n initialized successfully');
        } else {
            console.warn('Could not load activities.json, defaulting to English');
            await i18n.init('en');
            i18n.applyTranslations();
        }
    } catch (error) {
        console.error('Error initializing i18n:', error);
        await i18n.init('en');
        i18n.applyTranslations();
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const continueBtn = document.getElementById('continueBtn');
    const progressBar = document.getElementById('progressBar');

    // Botón continuar
    if (continueBtn) {
        console.log('Continue button found, adding click handler');
        continueBtn.addEventListener('click', () => {
            window.location = `./src/timeline.html`;
        });
    } else {
        console.error('Continue button not found!');
    }
});

// 🚀 Detectar mobile/desktop al cargar
updateIsMobile();
updateLayout();

// 📱 Detectar mobile/desktop y orientación al cambiar tamaño
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateIsMobile();
        updateLayout();
    }, 100);
}, { passive: true });
