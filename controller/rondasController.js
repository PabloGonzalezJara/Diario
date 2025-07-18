import RondasApi from '../models/rondasApi.js'

class RondasController {

    async getRondasEstudio(id_estudio,identificador) {

        
        const response = await RondasApi.getRondasEstudio( id_estudio,identificador )
        
        return response
    }
    async finalizarRonda(payload) {
        const response = await RondasApi.finalizarRonda(payload)
        return response
    }
}

export default new RondasController()