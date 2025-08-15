import api from './api.js'; 



export const AuthApi = {
  
  login: (payload) =>
    api.post('/auth/login', payload).then(res => res.data),


}

export default AuthApi
