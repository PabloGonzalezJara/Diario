// apiService.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

/**
 * @typedef {Object} LoginPayload
 * @property {string} rut         El RUT del usuario
 * @property {string} contrasena  La contraseña en claro (o hasheada)
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} status      'success' o 'error'
 * @property {string} message
 * @property {{ token: string, refreshToken: string }} data
 */

/**
 * @typedef {Object} Activity
 * @property {number}   [id]
 * @property {string}   title
 * @property {string}   time
 * @property {string}   date        En formato 'YYYY-MM-DD'
 * // …otros campos opcionales…
 */

export const ApiService = {
  /**
   * @param {LoginPayload} payload
   * @returns {Promise<LoginResponse>}
   */
  login: (payload) =>
    api.post('/auth/login', payload).then(res => res.data),

  // otros endpoints…
}

export default ApiService
