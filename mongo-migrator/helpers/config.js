export const SCHEMA_NAME = 'migrator'
export const TABLE_NAMES = ['jobs', 'job_events']
export const VERBOSE_LOGGING = true

// HDB Host (only localhost HDB Instances will work)
// This can be changed if HDB is not listening on the loopback address
export const HDB_HOST = '127.0.0.1'

// Fail the migration job task if the history cannot be loaded
export const FAIL_ON_HISTORY_ERROR = 'true'

// Key used to encrypt URIs in the DB
export const HASH_KEY = process.env.HASH_KEY || '4def21459ff46f214b35bd66f24c43aa'
