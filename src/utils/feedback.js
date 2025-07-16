// feedback.js

// Mapeo de posiciones -> clases Tailwind
const positions = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

// Auto-inyectar todos los posibles contenedores
document.addEventListener('DOMContentLoaded', () => {
    Object.keys(positions).forEach(pos => injectToastContainer(pos));
    injectInlineFeedback();
});

function injectToastContainer(position) {
    const id = `toast-container-${position}`;
    if (document.getElementById(id)) return;

    const div = document.createElement('div');
    div.id = id;
    div.className = `fixed z-50 space-y-4 ${positions[position]} transform`;
    document.body.appendChild(div);
}

// Mostrar toast en posición deseada
export function showToast(type, message, position = 'top-right', duration = 5000) {
    const container = document.getElementById(`toast-container-${position}`);
    if (!container) {
        console.warn(`Posición inválida "${position}", usando top-right`);
        return showToast(type, message, 'top-right', duration);
    }

    const toast = document.createElement('div');
    toast.className = `
  max-w-sm w-full shadow-lg rounded-lg px-4 py-3 text-sm 
  flex items-center text-center
  animate-fade-in-down transition-opacity duration-300
  ${{
            success: 'bg-green-100 text-green-800 border border-green-300',
            error: 'bg-red-100 text-red-800 border border-red-300',
            warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
            info: 'bg-blue-100 text-blue-800 border border-blue-300',
        }[type] || 'bg-gray-100 text-gray-800 border border-gray-300'
        }
`;

    toast.innerHTML = `
  <span class="flex-1 text-center">${message}</span>
  <button class="ml-2 font-bold" onclick="this.parentElement.remove()">✖</button>
`;

    container.appendChild(toast);

    if (duration > 0) {
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
}

// Inline feedback
function injectInlineFeedback() {
    if (!document.getElementById('feedback')) {
        const div = document.createElement('div');
        div.id = 'feedback';
        div.className = 'hidden my-4';
        document.body.prepend(div);
    }
}

