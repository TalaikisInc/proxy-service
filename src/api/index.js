import polka from 'polka'

import { read } from '../db'

const api = {}

api.get = async (url, proxies, proxyId) => {
  let proxy = `http://${proxies[proxyId]}`
  require('request-promise').defaults({
    proxy: proxy,
    strictSSL: false
  })(url).then((res) => {
    return { error: false, response: res }
  }).catch(async () => {
    proxyId += 1
    proxy = `http://${proxies[proxyId]}`
    await api.get(url, proxy)
  })
}

api.run = () => {
  polka()
    .get('/:url', (req, res) => {
      read('usable', async (err, proxies) => {
        if (!err && proxies.length > 0) {
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
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          let json = JSON.stringify({ error: 'Can\'t get proxies.' })
          res.end(json)
        }
      })

      // log results for each proxy
      // prefer best proxies
    })
    .listen(3000, (err) => {
      if (err) throw err
      console.log(`> Running on localhost:3000`)
    })
}

export default api
