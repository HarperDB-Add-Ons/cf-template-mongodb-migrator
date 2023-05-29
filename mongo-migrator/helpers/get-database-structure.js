import { MongoClient } from 'mongodb'

export default async (uri, logger) => {
  let client
  // Attempt to connect
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
    await client.connect()
  } catch (e) {
    await client.close()
    return { success: false, message: e.toString() }
  }

  // Get a list of databases
  const adminDb = client.db('admin').admin()

  let response
  try {
    response = await adminDb.listDatabases()
  } catch (e) {
    logger.error(e)
    await client.close()
    return { success: false, message: e.toString() }
  }

  const databases = response.databases
    .map(db => ({ name: db.name, size: `${(db.sizeOnDisk / 1024 ** 2).toFixed(2)} MB` }))

  // Get the collections for each database
  for (const dbName of databases.map(v => v.name)) {
    const db = client.db(dbName)

    let collections
    try {
      collections = await db.listCollections().toArray()
    } catch (e) {
      logger.error(e)
      await client.close()
      return { success: false, message: e.toString() }
    }
    const parent = databases.find(v => v.name === dbName)

    // Format collections into objects with just the name
    parent.children = collections
      .filter(c => c.type === 'collection')
      .map(v => ({ name: v.name }))

    // Pull collection stats
    for (const collection of parent.children) {
      let stats
      try {
        stats = await db.collection(collection.name.split('.')[0]).stats()
      } catch (e) {
        logger.error(e)
        await client.close()
        return { success: false, message: e.toString() }
      }
      collection.size = `${(stats.size / 1024 ** 2).toFixed(2)} MB`
      collection.count = stats.count
    }
  }

  // Close the open connection
  await client.close()

  return { success: true, structure: databases }
}
