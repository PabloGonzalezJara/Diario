/**
 * User management page logic
 * Handles listing users with pagination, opening create modal, and form submission
 */
import api from '../models/api.js';

const els = {
  table: document.getElementById('users-table'),
  tbody: document.getElementById('users-tbody'),
  message: document.getElementById('users-message'),
  pagination: document.getElementById('users-pagination'),
  paginationCurrent: document.getElementById('pagination-current'),
  paginationTotal: document.getElementById('pagination-total'),
  btnPrev: document.getElementById('btn-prev-page'),
  btnNext: document.getElementById('btn-next-page'),
  btnCreate: document.getElementById('btn-create-user'),
  modal: document.getElementById('createUserModal'),
  modalClose: document.getElementById('modal-close'),
  btnCancel: document.getElementById('btn-cancel'),
  form: document.getElementById('create-user-form'),
  inputIdentificador: document.getElementById('input-identificador'),
  inputContrasena: document.getElementById('input-contrasena'),
  estudiosCheckboxes: document.getElementById('estudios-checkboxes'),
  estudiosError: document.getElementById('estudios-error'),
  formMessage: document.getElementById('form-message'),
};

const state = {
  page: 1,
  limit: 20,
  totalPages: 1,
  estudiosLoaded: false,
};

/**
 * Fetch and render users for the current page
 */
async function loadUsers() {
  els.message.textContent = window.i18n ? window.i18n.t('messages.loading') : 'Cargando...';
  els.message.classList.remove('hidden');
  els.table.classList.add('hidden');
  els.pagination.classList.add('hidden');

  try {
    const res = await api.get('/users', { params: { page: state.page, limit: state.limit } });
    const payload = res.data.data || {};
    const users = payload.data || [];
    const pagination = payload.pagination || { page: 1, total_pages: 1 };

    state.totalPages = pagination.total_pages || 1;

    if (users.length === 0 && state.page === 1) {
      els.message.textContent = window.i18n ? window.i18n.t('messages.noActivities') : 'No se encontraron usuarios';
      els.message.classList.remove('hidden');
      return;
    }

    els.message.classList.add('hidden');
    els.table.classList.remove('hidden');
    els.pagination.classList.remove('hidden');
    els.tbody.innerHTML = '';

    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.innerHTML = `
        <td class="py-3">${escapeHtml(user.identificador)}</td>
        <td class="py-3">${user.cantidad_estudios}</td>
      `;
      els.tbody.appendChild(tr);
    });

    renderPagination();
  } catch (err) {
    console.error('Error loading users:', err);
    els.message.textContent = window.i18n ? window.i18n.t('messages.error') : 'Ocurrió un error';
    els.message.classList.remove('hidden');
  }
}

/**
 * Render pagination controls based on current state
 */
function renderPagination() {
  els.paginationCurrent.textContent = state.page;
  els.paginationTotal.textContent = state.totalPages;
  els.btnPrev.disabled = state.page <= 1;
  els.btnNext.disabled = state.page >= state.totalPages;
}

/**
 * Go to a specific page
 */
function goToPage(page) {
  if (page < 1 || page > state.totalPages) return;
  state.page = page;
  loadUsers();
}

/**
 * Fetch estudios and populate modal checkboxes
 */
async function loadEstudios() {
  if (state.estudiosLoaded) return;
  try {
    const res = await api.get('/estudios/all');
    const estudios = res.data.data || [];

    els.estudiosCheckboxes.innerHTML = '';

    if (estudios.length === 0) {
      els.estudiosCheckboxes.innerHTML = '<p class="text-gray-500 text-sm">' +
        (window.i18n ? window.i18n.t('messages.noActivities') : 'No se encontraron estudios') + '</p>';
      return;
    }

    estudios.forEach(estudio => {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-2 cursor-pointer';
      label.innerHTML = `
        <input type="checkbox" name="estudio" value="${estudio.id_estudio}" class="w-4 h-4" />
        <span>${escapeHtml(estudio.nombre)}</span>
      `;
      els.estudiosCheckboxes.appendChild(label);
    });

    state.estudiosLoaded = true;
  } catch (err) {
    console.error('Error loading estudios:', err);
    els.estudiosCheckboxes.innerHTML = '<p class="text-red-500 text-sm">' +
      (window.i18n ? window.i18n.t('messages.error') : 'Error al cargar estudios') + '</p>';
  }
}

/**
 * Open the create user modal
 */
function openModal() {
  els.modal.style.display = 'block';
  els.form.reset();
  els.formMessage.classList.add('hidden');
  els.estudiosError.classList.add('hidden');
  els.inputIdentificador.focus();
  loadEstudios();
}

/**
 * Close the create user modal
 */
function closeModal() {
  els.modal.style.display = 'none';
}

/**
 * Show a message in the form
 */
function showFormMessage(text, isError) {
  els.formMessage.textContent = text;
  els.formMessage.className = 'mb-4 text-sm ' + (isError ? 'text-red-500' : 'text-green-500');
  els.formMessage.classList.remove('hidden');
}

/**
 * Validate form inputs
 */
function validateForm() {
  const identificador = els.inputIdentificador.value.trim();
  const contrasena = els.inputContrasena.value;
  const checkedEstudios = els.estudiosCheckboxes.querySelectorAll('input[name="estudio"]:checked');

  if (!identificador || identificador.length < 1 || identificador.length > 100) {
    showFormMessage(
      window.i18n ? window.i18n.t('modals.manageUsers.errors.identificadorLength') : 'El identificador debe tener entre 1 y 100 caracteres',
      true
    );
    return null;
  }

  if (!contrasena || contrasena.length < 8) {
    showFormMessage(
      window.i18n ? window.i18n.t('modals.manageUsers.errors.contrasenaLength') : 'La contraseña debe tener al menos 8 caracteres',
      true
    );
    return null;
  }

  if (checkedEstudios.length === 0) {
    els.estudiosError.classList.remove('hidden');
    return null;
  }
  els.estudiosError.classList.add('hidden');

  const id_estudios = Array.from(checkedEstudios).map(cb => parseInt(cb.value, 10));
  return { identificador, contrasena: contrasena, id_estudios };
}

/**
 * Submit create user form
 */
async function handleSubmit(e) {
  e.preventDefault();

  const payload = validateForm();
  if (!payload) return;

  els.formMessage.classList.add('hidden');

  try {
    const res = await api.post('/users', payload);

    if (res.status === 201 || res.status === 200) {
      showFormMessage(
        window.i18n ? window.i18n.t('modals.manageUsers.messages.success') : 'Usuario creado exitosamente',
        false
      );
      setTimeout(() => {
        closeModal();
        // After creating, go to the last page so the new user is visible
        // (it'll be there if it fits; otherwise stay where we are and refresh)
        loadUsers().then(() => {
          if (state.page < state.totalPages) {
            state.page = state.totalPages;
            loadUsers();
          }
        });
      }, 1500);
    }
  } catch (err) {
    const msg = err.response?.data?.message ||
      err.response?.data?.code ||
      (window.i18n ? window.i18n.t('modals.manageUsers.messages.errorGeneric') : 'Ocurrió un error al crear el usuario');
    showFormMessage(msg, true);
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/**
 * Initialize page
 */
function init() {
  loadUsers();

  els.btnCreate.addEventListener('click', openModal);
  els.modalClose.addEventListener('click', closeModal);
  els.btnCancel.addEventListener('click', closeModal);

  els.btnPrev.addEventListener('click', () => goToPage(state.page - 1));
  els.btnNext.addEventListener('click', () => goToPage(state.page + 1));

  // Close on overlay click
  els.modal.addEventListener('click', e => {
    if (e.target === els.modal) closeModal();
  });

  // Close on ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && els.modal.style.display === 'block') closeModal();
  });

  els.form.addEventListener('submit', handleSubmit);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
