// src/controllers/HomeController.js
import timelineApi from '../models/TimelineApi.js'

/**
 * @typedef {import('@/models/Dimension').Dimension} Dimension
 */

/**
 * Controlador para la vista Home
 */
class TimelineApi {
  /**
   * Obtiene el menú de opciones (dimensiones con categorías y subcategorías).
   * @returns {Promise<Dimension[]>}
   */
  async fetchTimeline() {
    const id_estudio = localStorage.getItem('id_estudio')

    const menu = await timelineApi.getTimeline(id_estudio)

    return menu
  }

  async saveTimelineData(data) {
    return await timelineApi.saveTimelineData(data)
  }
}

export default new TimelineApi()
