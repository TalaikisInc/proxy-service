import { join } from 'path'
import polka from 'polka'
import JsonMemory from 'json-memory'

const proxies = new JsonMemory(join(__dirname, '../../.data', 'usable.json'))
const api = {}

api.get = async (url, proxies, proxyId) => {
  let proxy = `http://${proxies[proxyId].url}`
  require('request-promise').defaults({
    proxy: proxy,
    strictSSL: false
  })(url).then((res) => {
    return { error: false, response: res }
  }).catch(async () => {
    proxyId += 1
    proxy = `http://${proxies[proxyId].url}`
    await api.get(url, proxy)
  })
}

api.run = () => {
  polka()
    .get('/:url', async (req, res) => {
      const { err, data } = await api.get(req.params.url, proxies, 0)
      if (!err && data) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        let json = JSON.stringify({ data })
        res.end(json)
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        let json = JSON.stringify({ error: 'Something wrong.' })
        res.end(json)
      }
    })
    .listen(3000, (err) => {
      if (err) throw err
      console.log(`> Running on localhost:3000`)
    })
}

export default api
