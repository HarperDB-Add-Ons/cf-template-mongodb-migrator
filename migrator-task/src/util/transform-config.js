export default (configuration) => {
  const databases = {}
  // For each source/target configuration, build a list of DBs and their child collections
  configuration.forEach(entry => {
    if (!Object.keys(databases).includes(entry.source.database)) {
      databases[entry.source.database] = []
    }
    databases[entry.source.database].push(entry.source.collection)
  })
  return databases
}
