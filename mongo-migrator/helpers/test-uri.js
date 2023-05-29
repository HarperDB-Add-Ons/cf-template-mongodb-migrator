import { MongoClient } from 'mongodb'

export default async (uri) => {
  let client
  // Attempt to connect
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
    await client.connect()
  } catch (e) {
    return { valid: false, message: e.toString() }
  }

  // Close the open connection if successful
  await client.close()

  return { valid: true }
}
