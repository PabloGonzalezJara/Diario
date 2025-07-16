import api from './api.js'; // la instancia ya configurada




export const TimelineApi = {

  getTimeline: (id_estudio) =>
    api
      .get(`/dimensiones/getTimeline/${id_estudio}`)
      .then(res => (res.data).data),
  saveTimelineData: (data) => api.post('/registros/saveTimelineData', JSON.stringify(data))
}

export default TimelineApi
