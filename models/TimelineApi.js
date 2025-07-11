



const api = axios.create({
  baseURL: 'http://localhost:3000/api/',
  headers: { 'Content-Type': 'application/json' }
})

const token = localStorage.getItem('token')
// Interceptor para inyectar el token en cada petición
api.interceptors.request.use(
  config => {
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

export const TimelineApi = {

  getTimeline: (id_estudio) =>
    api
      .get(`/dimensiones/getTimeline/${id_estudio}`)
      .then(res => (res.data).data),
  saveTimelineData: (data) => api.post('/registros/saveTimelineData', JSON.stringify(data))
}

export default TimelineApi
