import { open, unlink, ftruncate, readdir, readFile } from 'fs'
import { join } from 'path'

import { write, stringToJson } from './utils'
const baseDir = join(__dirname, '../../.data')

export const create = (file, data, done) => {
  const fileName = join(baseDir, `${file}.json`)
  open(fileName, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data)
      write(fileDescriptor, dataString, done)
    } else {
      done('Cannot create new file, it may exist already.')
    }
  })
}

export const read = (file, done) => {
  readFile(join(baseDir, `${file}.json`), 'utf8', (err, data) => {
    if (!err && data) {
      stringToJson(data, (err, parsed) => {
        if (!err && parsed) {
          done(false, parsed)
        } else {
          done(err)
        }
      })
    } else {
      done(err, data)
    }
  })
}

export const readString = (file, done) => {
  readFile(join(baseDir, `${file}.json`), 'utf8', (err, data) => {
    if (!err && data) {
      done(false, data)
    } else {
      done(err)
    }
  })
}

export const update = (file, data, done) => {
  open(join(baseDir, `${file}.json`), 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data)
      ftruncate(fileDescriptor, () => {
        if (!err) {
          write(fileDescriptor, dataString, done)
        } else {
          done('Error truncating file.')
        }
      })
    } else {
      done('Cannot open file for updating, file may not exist.')
    }
  })
}

export const updateString = (file, data, done) => {
  open(join(baseDir, `${file}.json`), 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      ftruncate(fileDescriptor, () => {
        if (!err) {
          write(fileDescriptor, data, done)
        } else {
          done('Error truncating file.')
        }
      })
    } else {
      done('Cannot open file for updating, file may not exist.')
    }
  })
}

export const del = (file, done) => {
  unlink(join(baseDir, `${file}.json`), (err) => {
    if (!err) {
      done(false)
    } else {
      // @TODO possibly discern between file doens't exist and other errors
      done('Error deleting file.')
    }
  })
}

export const list = (dir, done) => {
  readdir(join(baseDir, dir), (err, data) => {
    if (!err && data && data.length > 0) {
      const trimmedFilename = []
      data.forEach((filename) => {
        if (filename.indexOf('.json') > -1) {
          trimmedFilename.push(filename.replace('.json', ''))
        }
      })
      done(false, trimmedFilename)
    } else {
      done(err, data)
    }
  })
}
