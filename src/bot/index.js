import https from 'https'
import chalk from 'chalk'
import { join } from 'path'
import { createWriteStream } from 'fs'
import request from 'request'
import { isIPv4 } from 'net'

import ProxyLists from './proxy-lists'
import { read, create, readString, updateString, del } from '../db'
import { BOT_INTERVAL } from '../config'

const getProxies = (done) => {
  let id = 0
  const options = {
    filterMode: 'loose',
    countriesBlackList: null,
    protocols: ['http', 'https'],
    anonymityLevels: ['transparent', 'anonymous', 'elite'],
    ipTypes: ['ipv4'],
    sourcesBlackList: ['bitproxies', 'kingproxies'],
    requestQueue: {
      concurrency: 10,
      delay: 100
    }
  }

  try {
    const _getProxies = ProxyLists.getProxies(options)
    del('proxies', (err) => {
      if (!err || err.includes('Error deleting file')) {
        const file = createWriteStream(join(__dirname, '../../.data', 'proxies.json'))

        _getProxies.on('data', (proxies) => {
          if (proxies && proxies.length > 0) {
            file.write(JSON.stringify(proxies))
            console.log(chalk.green(`Wrote proxies: ${id}.`))
            id += 1
          }
        })

        _getProxies.on('error', (error) => {
          console.log(chalk.red(error))
        })

        _getProxies.once('end', () => {
          done(false, 'Done.')
        })
      } else {
        console.log(chalk.red(err))
      }
    })
  } catch (e) {
    console.log(chalk.red(e))
  }
}

const normalize = (done) => {
  readString('proxies', (err, data) => {
    if (!err && data) {
      const newData = data.split('][').join(',')
      updateString('proxies', newData, (err) => {
        if (!err) {
          done(false, 'Normalized.')
        } else {
          done(err)
        }
      })
    } else {
      done(err)
    }
  })
}

const uniquify = (done) => {
  const out = []
  read('proxies', (err, data) => {
    if (!err && data) {
      let i = 1
      data.forEach((el) => {
        let proxy = `${el.ipAddress}:${el.port}`
        if (!out.includes(proxy) && isIPv4(el.ipAddress)) {
          out.push(proxy)
        }
        i += 1

        if (i === data.length) {
          del('unique', (err) => {
            if (!err || err.includes('Error deleting file')) {
              create('unique', out, (err) => {
                if (!err) {
                  done(false, 'Done with uniques.')
                } else {
                  done(err)
                }
              })
            } else {
              console.log(chalk.red(err))
            }
          })
        }
      })
    } else {
      done(err)
    }
  })
}

const test = (proxy, options, done) => {
  try {
    const proxyRequest = request.defaults({
      proxy: `http://${proxy}`,
      strictSSL: false
    })

    const startTime = new Date()
    proxyRequest(options.url, (err, res) => {
      if (err) {
        done(true, err)
      } else if (res.statusCode !== 200) {
        done(true, err)
      } else if (!res.body) {
        done(true, 'No body.')
      } else {
        const endTime = new Date()
        done(false, (endTime.getTime() - startTime.getTime()))
      }
    })
  } catch (e) {
    done(true, e)
  }
}

const testProxies = (done) => {
  const url = 'https://best.aliexpress.com/?lan=en'
  https.get(url, (res) => {
    const size = res.headers['content-length']
    del('tested', (err) => {
      if (!err || err.includes('Error deleting file')) {
        const file = createWriteStream(join(__dirname, '../../.data', 'tested.json'))
        let i = 1
        read('unique', (err, data) => {
          if (!err && data) {
            console.log(`Total to test: ${data.length}`)
            data.forEach((e) => {
              test(e, { url }, (err, timeTaken) => {
                if (!err) {
                  console.log(chalk.green('Found good one.'))
                  let speed = size / (timeTaken / 1000) / 1024
                  file.write(`{"url":"${e}","speed":"${speed} Kbps"},`)
                }

                if (i === data.length) {
                  done(false, 'Done.')
                }
                console.log(`${i}/${data.length}`)
                i += 1
              })
            })
          } else {
            console.log(chalk.red(err))
          }
        })
      } else {
        console.log(chalk.red(err))
      }
    })
  })
}

const normalizeTested = (done) => {
  readString('tested', (err, data) => {
    if (!err && data) {
      const newData = `["${data.split(',').join('')}]`.replace(',]', ']')
      create('usable', newData, (err) => {
        if (!err) {
          done(false, 'Normalized.')
        } else {
          done(err)
        }
      })
    } else {
      console.log(chalk.red(err))
    }
  })
}

const run = () => {
  // @FIXME first one does stuck, resolve nefore going firther
  getProxies((err, res) => {
    if (!err && res) {
      normalize((err, res) => {
        if (!err && res) {
          uniquify((err, res) => {
            if (!err && res) {
              testProxies((err, res) => {
                if (!err && res) {
                  normalizeTested((err, res) => {
                    if (!err && res) {
                      console.log(chalk.green('Done.'))
                    } else {
                      console.log(chalk.red(err))
                    }
                  })
                } else {
                  console.log(chalk.red(err))
                }
              })
            } else {
              console.log(chalk.red(err))
            }
          })
        } else {
          console.log(chalk.red(err))
        }
      })
    } else {
      console.log(chalk.red(err))
    }
  })
}

const bot = {}

bot.loop = () => {
  run()

  setInterval(() => {
    run()
  }, 1000 * BOT_INTERVAL)
}

export default bot
