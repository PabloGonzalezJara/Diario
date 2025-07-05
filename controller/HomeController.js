// src/controllers/HomeController.js
import HomeViewApi from '../models/HomeViewApi.js'

/**
 * @typedef {import('@/models/Dimension').Dimension} Dimension
 */

/**
 * Controlador para la vista Home
 */
class HomeController {
  /**
   * Obtiene el menú de opciones (dimensiones con categorías y subcategorías).
   * @returns {Promise<Dimension[]>}
   */
  async fetchTimeline() {
    const menu = await HomeViewApi.getTimeline()
    console.log('Menú de opciones:', menu)
    return menu
  }
}

export default new HomeController()
