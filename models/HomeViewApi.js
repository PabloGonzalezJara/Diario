// HomeViewApi.js



/**
 * @typedef {import('./Dimension').Dimension} Dimension
 */

/**
 * @typedef {Object} MenuResponse
 * @property {string} status      'success' o 'error'
 * @property {string} message
 * @property {Dimension[]} data   Array de dimensiones con categorías y subcategorías
 */

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor para inyectar el token en cada petición
api.interceptors.request.use(
  config => {
    const token = ''
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

export const HomeViewApi = {
  /**
   * Obtiene el menú de opciones (dimensiones con categorías y subcategorías).
   * @returns {Promise<Dimension[]>} Array de dimensiones
   */
  getTimeline: () =>
    api
      .get('/dimensiones/getTimeline/1')
      .then(res => /** @type {MenuResponse} */ (res.data).data)
}

export default HomeViewApi
