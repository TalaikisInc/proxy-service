import bot from './bot'
import api from './api'

const init = () => {
  api.run()
  bot.loop()
}

init()
