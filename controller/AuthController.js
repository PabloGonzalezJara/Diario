// src/controllers/AuthController.js
import AuthApi from '../models/AuthApi.js'



class AuthController {
  
  async login(payload) {
    if (!payload.identificador || !payload.contrasena) {
      throw new Error('RUT y contraseña son obligatorios')
    }
    // La API responde con { status, message, data: { token, refreshToken } }
    const response = await AuthApi.login(payload)
    return {
      token: response.data.token,
      refreshToken: response.data.refreshToken
    }
  }
}

export default new AuthController()
