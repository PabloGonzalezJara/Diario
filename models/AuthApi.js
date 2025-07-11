


/**
 * @typedef {Object} LoginPayload
 * @property {string} contrasena         El RUT del usuario
 * @property {string} identificador  La contraseña en claro (o hasheada)
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
const api = axios.create({
  baseURL: 'http://localhost:3000/api/',
  headers: { 'Content-Type': 'application/json' }
})
export const AuthApi = {
  /**
   * @param {LoginPayload} payload
   * @returns {Promise<LoginResponse>}
   */
  login: (payload) =>
    api.post('/auth/login', payload).then(res => res.data),


}

export default AuthApi
