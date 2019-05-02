import { join } from 'path'
import polka from 'polka'
import JsonMemory from 'json-memory'

const proxies = new JsonMemory(join(__dirname, '../../.data', 'usable.json'))
const api = {}

api.get = async (url, proxyId, done) => {
  url = `https://${url}`
  let entry = proxies[`${proxyId}`]
  let proxy = `http://${entry.url}`
  require('request-promise').defaults({
    proxy: proxy,
    strictSSL: false
  })(url).then((res) => {
    done(false, res)
  }).catch(async (e) => {
    proxyId += 1
    entry = proxies[`${proxyId}`]
    proxy = `http://${entry.url}`
    await api.get(url, proxyId, done)
  })
}

api.run = () => {
  polka()
    .get('/get/:url/:key', async (req, res) => {
      if (process.env.API_KEY === req.params.key) {
        if (req.params.url) {
          await api.get(req.params.url, 0, (err, data) => {
            if (!err && data) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              let json = JSON.stringify({ data })
              res.end(json)
            } else {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              let json = JSON.stringify({ error: 'Something wrong.' })
              res.end(json)
            }
          }).catch((e) => {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            let json = JSON.stringify({ error: e })
            res.end(json)
          })
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          let json = JSON.stringify({ error: 'No URL provided.' })
          res.end(json)
        }
      } else {
        res.writeHead(403, { 'Content-Type': 'application/json' })
        let json = JSON.stringify({ error: 'Unauthorized.' })
        res.end(json)
      }
    })
    .listen(3000, (err) => {
      if (err) throw err
      console.log(`> Running on localhost:3000`)
    })
}

export default api
