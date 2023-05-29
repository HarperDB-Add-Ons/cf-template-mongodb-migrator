export default (uri) => {
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/(?:[^:]+:.*@)?([^/]+)(?:\/.*)?$/)
  if (!match) return uri
  return match[1]
}
