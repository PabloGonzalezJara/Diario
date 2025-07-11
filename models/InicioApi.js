import api from './api.js'; // la instancia ya configurada


export const InicioApi = {

    getEstudiosForUser: () =>
        api
            .get('/estudios/getEstudiosForUser/')
            .then(res => (res.data)),

}

export default InicioApi
