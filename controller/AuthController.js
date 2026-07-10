// src/controllers/AuthController.js
import AuthApi from '../models/AuthApi.js'



class AuthController {
  
  async login(payload) {
    if (!payload.identificador || !payload.contrasena) {
      throw new Error('RUT y contraseña son obligatorios')
    }
    // La API responde con { status, message, data: { token, refreshToken, crear_usuario } }
    const response = await AuthApi.login(payload)
    return {
      token: response.data.token,
      refreshToken: response.data.refreshToken,
      crear_usuario: response.data.crear_usuario
    }
  }
}

export default new AuthController()
