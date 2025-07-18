import api from './api.js'; // la instancia ya configurada




export const TimelineApi = {

  getTimeline: (id_estudio) =>
    api
      .get(`/dimensiones/getTimeline/${id_estudio}`)
      .then(res => (res.data).data),
  saveTimelineData: (data) => api.post('/registros/saveTimelineData', JSON.stringify(data)),
  getTimelineRegistros: (payload) => api.get(`/registros/getTimelineRegistros/${payload.id_estudio}/${payload.id_ronda}/${payload.identificador}`).then(res => (res.data).data)
}

export default TimelineApi
