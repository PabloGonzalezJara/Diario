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

// Expose globally
window.getCurrentUser = getCurrentUser;
