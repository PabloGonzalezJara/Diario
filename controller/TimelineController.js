// src/controllers/HomeController.js
import timelineApi from '../models/TimelineApi.js'


class TimelineApi {
  
  async fetchTimeline() {
    const id_estudio = localStorage.getItem('id_estudio')

    const menu = await timelineApi.getTimeline(id_estudio)

    return menu
  }

  async saveTimelineData(data) {
    return await timelineApi.saveTimelineData(data)
  }


  async getTimelineRegistros(payload) {
    const res = await timelineApi.getTimelineRegistros(payload)
    
    return res
  }
}

export default new TimelineApi()
