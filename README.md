# HarperDB MongoDB Migrator

This repository provides a migration tool to sync records from an existing MongoDB database to HarperDB. Configurable on a collection-by-collection basis, you can automatically and consistently sync records to your desired schemas and tables.

This Migrator is powered by HarperDB's Custom Functions, so everything is self-contained within your HarperDB Instance.

# Installing

To install the migrator, grab the latest release from the Releases page. This package will contain a built version of the User Interface, the migrator task, and the custom functions.

You can then drop this folder into your `custom_functions` folder inside of your HarperDB data directory, install the dependencies, and get started:

```shell
# Change to your data directory
cd /home/ubuntu/hdb/custom_functions
# Download the latest release
wget ...
# Extract the tarball
tar xzf ...
# Install the dependencies
cd mongo-migrator && yarn # (or use npm)
cd migrator-task && yarn
# Setup a unique hash key (for encryption at-rest)
cd ..
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

In HarperDB Studio, or via the CLI, restart the Custom Functions service. Once it has restarted, you should be able to access the User Interface at `https://$HDB_HOST:$HDB_CUSTOM_FUNCTIONS_PORT/mongo-migrator/static`.

# Building
If you wanted to customize a part of the project, you can run `yarn build` to build your own custom release. With this custom release, you can then follow the installation instructions above to deploy it to your HarperDB Instance of choice.

The build command will perform the following actions:
1. Install the dependencies required for each project
2. Package the user interface for deployment
3. Arrange the project into the format HarperDB expects

# Troubleshooting

All of the migrators logs are contained with the `mongo-migrator` folder inside of the HarperDB log directory. The log names are appended with a subset of the Job's unique ID for easier identification. They are also stored in JSON format for easy parsing.

For example: `/home/ubuntu/hdb/log/mongo-migrator/combined-171f9ede6ca1.log.2023-05-29`