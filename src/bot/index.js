import https from 'https'
import chalk from 'chalk'
import { join } from 'path'
import { createWriteStream } from 'fs'
import request from 'request'

import ProxyLists from './proxy-lists'
import { read, create, readString, updateString, del } from '../db'
import { BOT_INTERVAL } from '../config'

const getProxies = async () => {
  let id = 0
  const options = {
    filterMode: 'strict',
    countriesBlackList: null,
    protocols: ['http', 'https'],
    anonymityLevels: ['anonymous', 'elite'],
    countries: ['us', 'ca'],
    ipTypes: ['ipv4']
  }

  const _getProxies = ProxyLists.getProxies()
  del('proxies', (err) => {
    if (!err) {
      const file = createWriteStream(join(__dirname, '../.data', 'proxies.json'))

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
        console.log(chalk.green('Got all proxies.'))
      })
    } else {
      console.log(chalk.red(err))
    }
  })
}

const normalize = async () => {
  readString('proxies', (err, data) => {
    if (!err && data) {
      const newData = data.split('][').join(',')
      updateString('proxies', newData, (err) => {
        if (!err) {
          console.log(chalk.green('Normalized.'))
        } else {
          console.log(chalk.red(err))
        }
      })
    } else {
      console.log(chalk.red(err))
    }
  })
}

const uniquify = async () => {
  const out = []
  read('proxies', (err, data) => {
    if (!err && data) {
      let i = 1
      data.forEach((el) => {
        let proxy = `${el.ipAddress}:${el.port}`
        if (!out.includes(proxy)) {
          out.push(proxy)
        }
        i += 1

        if (i === data.length) {
          del('unique', (err) => {
            if (!err) {
              create('unique', out, (err) => {
                if (!err) {
                  console.log(chalk.green('Done with uniques.'))
                } else {
                  console.log(chalk.red(err))
                }
              })
            } else {
              console.log(chalk.red(err))
            }
          })
        }
      })
    } else {
      console.log(chalk.red(err))
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

const testProxies = async () => {
  const url = 'https://best.aliexpress.com/?lan=en'
  https.get(url, (res) => {
    const size = res.headers['content-length']
    del('tested', (err) => {
      if (!err) {
        const file = createWriteStream(join(__dirname, '../.data', 'tested.json'))
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

const normalizeTested = async () => {
  readString('tested', (err, data) => {
    if (!err && data) {
      const newData = `["${data.split(',').join('')}]`.replace(',]', ']')
      create('usable', newData, (err) => {
        if (!err) {
          console.log(chalk.green('Normalized.'))
        } else {
          console.log(chalk.red(err))
        }
      })
    } else {
      console.log(chalk.red(err))
    }
  })
}

const run = async () => {
  await getProxies() // @FIXME this one does stuck, resolve nefore going firther
  await normalize()
  await uniquify()
  await testProxies()
  await normalizeTested()
}

const bot = {}

bot.loop = () => {
  setInterval(() => {
    run()
  }, 1000 * BOT_INTERVAL)
}

export default bot
