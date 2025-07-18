import api from './api.js'; 


export const InicioApi = {

    getEstudiosForUser: () =>
        api
            .get('/estudios/getEstudiosForUser/')
            .then(res => (res.data)),

}

export default InicioApi
