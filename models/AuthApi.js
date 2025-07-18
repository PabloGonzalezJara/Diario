



const api = axios.create({
  baseURL: 'http://localhost:3000/api/',
  headers: { 'Content-Type': 'application/json' }
})
export const AuthApi = {
  
  login: (payload) =>
    api.post('/auth/login', payload).then(res => res.data),


}

export default AuthApi
