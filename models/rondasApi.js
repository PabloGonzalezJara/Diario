import api from './api.js'; 

export const RondasApi = {
    getRondasEstudio: (id_estudio,identificador) =>
    api
      .get(`/rondas/getRondasEstudio/${id_estudio}/${identificador}`)
      .then(res => (res.data).data),
    finalizarRonda: (payload) =>
      api.post('/rondas/finalizarRonda', payload)
      .then(res => (res.data).data),
        
    
}

export default RondasApi