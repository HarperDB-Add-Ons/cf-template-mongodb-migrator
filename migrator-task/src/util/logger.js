import { resolve } from 'path'
import winston from 'winston'
import 'winston-daily-rotate-file'

// TODO remove
const MIGRATOR_LOG_LEVEL = 'info'
const HDB_DIR = '/home/administrator/hdb'
const uniqueId = process.env.JOB_ID.substring(24)

const logger = winston.createLogger({
  level: MIGRATOR_LOG_LEVEL,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    // Log to the console
    new winston.transports.Console(),
    // Log to a combined file with stderr + stdout
    // which will automatically rotate
    new winston.transports.DailyRotateFile({
      filename: resolve(HDB_DIR, 'log/mongo-migrator', `combined-${uniqueId}.log`),
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      createSymlink: true,
      symlinkName: resolve(HDB_DIR, 'log/mongo-migrator', `combined-${uniqueId}-active.log`)
    })
  ]
})

export default logger
