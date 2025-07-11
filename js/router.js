const app = document.getElementById('app');

// Rutas válidas
const routes = {
  '/': renderHome,
  
};

// Funciones de renderizado
function renderHome() {
  window.location.href = '/src/pages/login.html';
  app.innerHTML = `<h1>Inicio</h1><p>Bienvenido a la app SPA.</p>`;
}


function render404() {
  window.location.href = '/src/pages/404.html';
}

// Manejador simple de rutas
function navigateTo(path) {
  history.pushState({}, '', path);
  handleRoute(path);
}

// Detectar ruta actual
function handleRoute(path) {
  
  const render = routes[path];
  if (render) {
    render();
  } else {
    render404();
  }
}

// Soporte para navegación por el historial
window.addEventListener('popstate', () => handleRoute(window.location.pathname));

// Iniciar
handleRoute(window.location.pathname);

// Exponer la función de navegación al global
window.navigateTo = navigateTo;
