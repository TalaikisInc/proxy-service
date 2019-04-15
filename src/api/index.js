import polka from 'polka'

const api = {}

api.run = () => {
  polka()
    .get('/:url', (req, res) => {
      // get proxy from usable
      // request url, repeat with others until successful
      // log results for each proxy
      // prefer best proxies
      // send response
      res.end(`url: ${req.params.url}`)
    })
    .listen(3000, (err) => {
      if (err) throw err
      console.log(`> Running on localhost:3000`)
    })
}

export default api
