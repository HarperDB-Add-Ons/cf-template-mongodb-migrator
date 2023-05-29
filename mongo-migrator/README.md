# HarperDB MongoDB Migrator Custom Function

Contains the underlying code for the migrator's Custom Functions. Helps manage the task via PM2 and provide a method to ingest the data from the MongoDB server.

## Installation

```shell
# Install the dependencies
yarn # (or use npm)

# Setup a unique hash key (for encryption at-rest)
# Generate a random hash
openssl rand -hex 16
# Edit the configuration
nano helpers/config.js
```

Edit line 13, replacing the default hash with your own, or provide it via an environment variable:
```js
// Key used to encrypt URIs in the DB
export const HASH_KEY = process.env.HASH_KEY || '4def21459ff46f214b35bd66f24c43aa'
```