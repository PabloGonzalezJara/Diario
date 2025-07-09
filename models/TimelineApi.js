



const api = axios.create({
  baseURL: 'http://localhost:3000/api/',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor para inyectar el token en cada petición
api.interceptors.request.use(
  config => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTIwODE3MjAsImV4cCI6MTc1MjA4ODkyMH0._UxfEciZRCFhIxHgvQD48BRrq-UVIWSTbIEsUomTcmA'
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

export const TimelineApi = {

  getTimeline: () =>
    api
      .get('/dimensiones/getTimeline/1')
      .then(res => (res.data).data),
  saveTimelineData : (data) => api.post('/registros/saveTimelineData', JSON.stringify(data))
}

export default TimelineApi
