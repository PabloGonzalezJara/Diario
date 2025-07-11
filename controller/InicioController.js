// src/controllers/AuthController.js
import InicioApi from '../models/InicioApi.js'



class InicioController {

    async getEstudiosForUser() {

        
        const response = await InicioApi.getEstudiosForUser()
        
        return response
    }
}

export default new InicioController()
