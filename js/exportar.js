/**
 * Export page logic
 * Handles filter modal, paginated records table, and XLSX download
 */
import api from '../models/api.js';
import { showToast } from '../src/utils/feedback.js';

const els = {
  table: document.getElementById('export-table'),
  tbody: document.getElementById('export-tbody'),
  message: document.getElementById('export-message'),
  pagination: document.getElementById('export-pagination'),
  paginationCurrent: document.getElementById('export-pagination-current'),
  paginationTotal: document.getElementById('export-pagination-total'),
  btnPrev: document.getElementById('btn-prev-page'),
  btnNext: document.getElementById('btn-next-page'),
  btnFilter: document.getElementById('btn-filter'),
  btnDownload: document.getElementById('btn-download'),
  modal: document.getElementById('filterModal'),
  modalClose: document.getElementById('filter-modal-close'),
  btnCancel: document.getElementById('btn-filter-cancel'),
  form: document.getElementById('filter-form'),
  selectEstudio: document.getElementById('filter-estudio'),
  rondasContainer: document.getElementById('filter-rondas'),
};

const state = {
  id_estudio: null,
  id_rondas: [],
  page: 1,
  limit: 20,
  totalPages: 1,
  estudiosLoaded: false,
};

const COLUMNS = [
  'identificador', 'hora_inicio', 'hora_termino', 'minutos',
  'nombre_categoria', 'nombre_subcategoria', 'nombre_actividad',
  'otroValor', 'secundaria', 'ubicación', 'compañia', 'satisfacción', 'numero_ronda', 'dias_semana',
];

/**
 * Translate a MySQL SET dias_semana value (e.g. "1,2,3,4,5") into a
 * human-readable label. Keeps the raw value as fallback when the set
 * doesn't match any known pattern.
 */
function formatDiasSemana(value) {
  if (value === null || value === undefined || value === '') return '';
  const set = new Set(String(value).split(',').map(v => v.trim()).filter(Boolean));
  const all = ['0', '1', '2', '3', '4', '5', '6'];
  const allDays = all.every(d => set.has(d));
  const weekday = ['1', '2', '3', '4', '5'].every(d => set.has(d)) && !set.has('0') && !set.has('6');
  const weekend = ['0', '6'].every(d => set.has(d)) && ['1', '2', '3', '4', '5'].every(d => !set.has(d));
  const lunSab = ['1', '2', '3', '4', '5', '6'].every(d => set.has(d)) && !set.has('0');
  const domVie = ['0', '1', '2', '3', '4', '5'].every(d => set.has(d)) && !set.has('6');
  if (allDays) return 'Todos';
  if (weekday) return 'Lun-Vie';
  if (weekend) return 'Sáb-Dom';
  if (lunSab) return 'Lun-Sáb';
  if (domVie) return 'Dom-Vie';
  return String(value);
}

const i18n = (key, fallback) => window.i18n ? window.i18n.t(key) : fallback;

function escapeHtml(value) {
  return value === null || value === undefined ? '' :
    String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function formatCell(value, key) {
  if (value === null || value === undefined || value === '') return '';
  if ((key === 'hora_inicio' || key === 'hora_termino') && typeof value === 'string') {
    const m = value.match(/[T ](\d{2}:\d{2})/);
    if (m) return m[1];
  }
  return value;
}

/**
 * Fetch paginated registros for the current filter and render them.
 * Supports both paginated `{ data, pagination }` and legacy array shapes.
 */
async function loadRegistros() {
  els.message.textContent = i18n('messages.loading', 'Cargando...');
  els.message.classList.remove('hidden');
  els.table.classList.add('hidden');
  els.pagination.classList.add('hidden');

  const params = { page: state.page, limit: state.limit };
  if (state.id_estudio && state.id_rondas.length > 0) {
    params.id_estudio = state.id_estudio;
    params.id_rondas = state.id_rondas.join(',');
  }

  try {
    const res = await api.get('/registros/export', { params });

    const inner = res.data.data || {};
    const rows = Array.isArray(inner) ? inner : (inner.data || []);
    const pagination = Array.isArray(inner)
      ? { page: 1, total_pages: 1 }
      : (inner.pagination || { page: 1, total_pages: 1 });

    state.totalPages = pagination.total_pages || 1;
    if (state.page > state.totalPages) state.page = state.totalPages || 1;

    if (rows.length === 0) {
      els.message.textContent = i18n('messages.noActivities', 'No se encontraron registros');
      els.message.classList.remove('hidden');
      return;
    }

    els.message.classList.add('hidden');
    els.table.classList.remove('hidden');
    els.pagination.classList.remove('hidden');
    els.btnDownload.classList.remove('hidden');
    els.tbody.innerHTML = '';

    rows.forEach(row => {
      const cells = COLUMNS.map(key => {
        const value = key === 'dias_semana' ? formatDiasSemana(row[key]) : row[key];
        return `<td class="py-3 px-2 whitespace-nowrap">${escapeHtml(formatCell(value, key))}</td>`;
      }).join('');
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.innerHTML = cells;
      els.tbody.appendChild(tr);
    });

    renderPagination();
  } catch (err) {
    console.error('Error loading registros:', err);
    els.message.textContent = err?.response?.data?.message || i18n('messages.error', 'Ocurrió un error');
    els.message.classList.remove('hidden');
  }
}

function renderPagination() {
  els.paginationCurrent.textContent = state.page;
  els.paginationTotal.textContent = state.totalPages;
  els.btnPrev.disabled = state.page <= 1;
  els.btnNext.disabled = state.page >= state.totalPages;
}

function goToPage(page) {
  if (page < 1 || page > state.totalPages || page === state.page) return;
  state.page = page;
  loadRegistros();
}

async function loadEstudios() {
  if (state.estudiosLoaded) return;
  try {
    const res = await api.get('/estudios/all');
    const inner = res.data.data || [];
    const estudios = Array.isArray(inner) ? inner : (inner.data || []);

    els.selectEstudio.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = i18n('pages.export.filter.selectStudy', 'Selecciona un estudio');
    els.selectEstudio.appendChild(placeholder);

    if (estudios.length === 0) {
      placeholder.textContent = i18n('messages.noActivities', 'No hay estudios disponibles');
      return;
    }

    estudios.forEach(estudio => {
      const option = document.createElement('option');
      option.value = estudio.id_estudio;
      option.textContent = estudio.nombre;
      els.selectEstudio.appendChild(option);
    });

    state.estudiosLoaded = true;
  } catch (err) {
    console.error('Error loading estudios:', err);
    showToast('error', i18n('messages.error', 'Error al cargar estudios'), 'top-center', 2000);
  }
}

async function loadRondasDelEstudio(id_estudio) {
  els.rondasContainer.innerHTML = `<p class="text-gray-500 text-sm">${i18n('messages.loading', 'Cargando...')}</p>`;

  try {
    const res = await api.get(`/estudios/all/${id_estudio}/rondas`);
    const inner = res.data.data || [];
    const rondas = Array.isArray(inner) ? inner : (inner.data || []);

    els.rondasContainer.innerHTML = '';

    if (rondas.length === 0) {
      els.rondasContainer.innerHTML = `<p class="text-gray-500 text-sm">${i18n('messages.noActivities', 'No hay rondas disponibles')}</p>`;
      return;
    }

    rondas.forEach(ronda => {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-2 cursor-pointer';
      const tipo = formatDiasSemana(ronda.dias_semana);
      const sufijo = tipo ? ` (${tipo})` : '';
      label.innerHTML = `
        <input type="checkbox" name="ronda" value="${ronda.id_ronda}" class="w-4 h-4" />
        <span>${escapeHtml(`Ronda ${ronda.numero_ronda} - ${ronda.anio}${sufijo}`)}</span>
      `;
      els.rondasContainer.appendChild(label);
    });
  } catch (err) {
    console.error('Error loading rondas:', err);
    els.rondasContainer.innerHTML = `<p class="text-red-500 text-sm">${i18n('messages.error', 'Error al cargar rondas')}</p>`;
  }
}

async function openFilterModal() {
  els.modal.style.display = 'block';
  els.form.reset();
  if (state.id_estudio) {
    els.selectEstudio.value = state.id_estudio;
    await loadRondasDelEstudio(state.id_estudio);
    els.rondasContainer.querySelectorAll('input[name="ronda"]').forEach(cb => {
      if (state.id_rondas.includes(parseInt(cb.value, 10))) cb.checked = true;
    });
  } else {
    els.rondasContainer.innerHTML = '';
  }
  await loadEstudios();
  els.selectEstudio.focus();
}

function closeFilterModal() {
  els.modal.style.display = 'none';
}

function handleFilterSubmit(e) {
  e.preventDefault();
  const id_estudio = parseInt(els.selectEstudio.value, 10);
  if (!Number.isInteger(id_estudio) || id_estudio <= 0) {
    showToast('error', i18n('pages.export.errors.selectStudy', 'Selecciona un estudio'), 'top-center', 2000);
    els.selectEstudio.focus();
    return;
  }
  const checkedRondas = els.rondasContainer.querySelectorAll('input[name="ronda"]:checked');
  const id_rondas = Array.from(checkedRondas).map(cb => parseInt(cb.value, 10));
  if (id_rondas.length === 0) {
    showToast('error', i18n('pages.export.errors.minOneRound', 'Selecciona al menos una ronda'), 'top-center', 2000);
    return;
  }

  state.id_estudio = id_estudio;
  state.id_rondas = id_rondas;
  state.page = 1;
  closeFilterModal();
  loadRegistros();
}

function buildFileName() {
  const estudioText = els.selectEstudio.options[els.selectEstudio.selectedIndex]?.text || (state.id_estudio ? `estudio_${state.id_estudio}` : 'todos_los_estudios');
  const estudioSlug = estudioText.replace(/[^a-zA-Z0-9-_]+/g, '_');
  const rondasPart = state.id_rondas.length > 0 ? state.id_rondas.join('-') : 'todas';
  return `${estudioSlug}_rondas_${rondasPart}.xlsx`;
}

async function downloadXlsx() {
  const btn = els.btnDownload;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = i18n('messages.loading', 'Cargando...');

  const params = { download: 1 };
  if (state.id_estudio && state.id_rondas.length > 0) {
    params.id_estudio = state.id_estudio;
    params.id_rondas = state.id_rondas.join(',');
  }

  try {
    const res = await api.get('/registros/export', {
      params,
      validateStatus: status => status === 200 || status === 413,
    });

    if (res.status === 413) {
      const detail = res.data?.message;
      showToast('error',
        detail || i18n('messages.exportTooLarge', 'Demasiados registros para exportar. Refina el filtro (estudio o rondas) e intenta de nuevo.'),
        'top-center', 4000);
      return;
    }

    const inner = res.data.data || {};
    const rows = Array.isArray(inner) ? inner : (inner.data || []);
    if (rows.length === 0) {
      showToast('error', i18n('messages.noActivities', 'No hay registros para descargar'), 'top-center', 2000);
      return;
    }

    // Format dates/days before exporting so the xlsx is human-readable.
    const formattedRows = rows.map(row => {
      const out = {};
      for (const key of Object.keys(row)) {
        if (key === 'dias_semana') {
          out[key] = formatDiasSemana(row[key]);
        } else if (key === 'hora_inicio' || key === 'hora_termino') {
          out[key] = formatCell(row[key], key);
        } else {
          out[key] = row[key];
        }
      }
      return out;
    });

    // xlsx is loaded as a global UMD script in the page (window.XLSX).
    const XLSX = window.XLSX;
    if (!XLSX) {
      throw new Error('XLSX library not loaded');
    }
    const ws = XLSX.utils.json_to_sheet(formattedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros');
    XLSX.writeFile(wb, buildFileName());

    showToast('success', i18n('messages.exportSuccess', 'Archivo descargado'), 'top-center', 2000);
  } catch (err) {
    console.error('Error downloading xlsx:', err);
    showToast('error', err?.response?.data?.message || i18n('messages.exportError', 'Error al generar el archivo'), 'top-center', 3000);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function init() {
  loadRegistros();

  els.btnFilter.addEventListener('click', openFilterModal);
  els.modalClose.addEventListener('click', closeFilterModal);
  els.btnCancel.addEventListener('click', closeFilterModal);
  els.btnDownload.addEventListener('click', downloadXlsx);

  els.btnPrev.addEventListener('click', () => goToPage(state.page - 1));
  els.btnNext.addEventListener('click', () => goToPage(state.page + 1));

  els.selectEstudio.addEventListener('change', () => {
    const id = parseInt(els.selectEstudio.value, 10);
    if (Number.isInteger(id) && id > 0) {
      loadRondasDelEstudio(id);
    } else {
      els.rondasContainer.innerHTML = '';
    }
  });

  els.modal.addEventListener('click', e => {
    if (e.target === els.modal) closeFilterModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && els.modal.style.display === 'block') closeFilterModal();
  });

  els.form.addEventListener('submit', handleFilterSubmit);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
