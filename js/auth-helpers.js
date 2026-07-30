/**
 * Auth helpers - JWT decode and user info extraction
 * No external libraries: uses only atob() and JSON.parse
 */

function getCurrentUser() {
  const t = localStorage.getItem('token');
  if (!t) return { identificador: null, crear_usuario: false };
  try {
    const parts = t.split('.');
    if (parts.length !== 3) return { identificador: null, crear_usuario: false };
    const p = JSON.parse(atob(parts[1]));
    return {
      identificador: p.identificador || null,
      crear_usuario: p.crear_usuario === true
    };
  } catch {
    return { identificador: null, crear_usuario: false };
  }
}

/**
 * Clear all auth-related session data from localStorage and redirect
 * to the login page. Used by the Logout button.
 *
 * Clears: token, refreshToken, identificador, crear_usuario, and any
 * auxiliary state the app has cached (selected study, round, etc.).
 */
function logout() {
  const keys = [
    'token',
    'refreshToken',
    'identificador',
    'crear_usuario',
    'estudios',
    'id_estudio',
    'id_ronda',
  ];
  keys.forEach(k => localStorage.removeItem(k));
  window.location.href = './login.html';
}

// Expose globally
window.getCurrentUser = getCurrentUser;
window.logout = logout;
