# Migrator Task

Background task responsible for reading information from MongoDB and passing it to HarperDB via the ingestion route. This task is automatically managed via PM2 and the custom functions.

# Configuration
Some static configuration is housed within [src/util/config.js](src/util/config.js):
|Key|Description|Default|
|-:|--|--|
|sleepTimeMs|placeholder|`30 * 1000`|
|failOnHistoryErrorDefault|placeholder|`'true'`|

# Environment Variables
Other configuration is handled via environment variables:
|Environment Variable|Required|Description|Default|
|-:|:-:|-|-|
|MONGO_URI| Yes |MongoDB connection URI| N/A
|JOB_ID| Yes |Job ID that this worker is for|N/A
|HDB_HTTPS_ON| No |Whether or not HTTPS is enabled for your HarperDB Instance| `'false'`
|HDB_HOST| No |The address on which your HarperDB Instance is listening on (this tool does not work with remote instances) |127.0.0.1
|HDB_CF_PORT| No |Which port on your HarperDB Instance Custom Functions are running on| 9926
|HDB_PROJECT_NAME| Yes |The project name that the MongoDB Migrator tool is using| N/A
|REJECT_UNAUTHORIZED_CERTS| No |Whether or not to reject bad certs (self signed, expired, etc)|`'false'` (tool will not reject bad certs)
|FAIL_ON_HISTORY_ERROR| No | If the tool is unable to load where it left off during the sync, do you want it to fail out, or continue and load all of the data from the start again?| `'true'` (tool will exit)
