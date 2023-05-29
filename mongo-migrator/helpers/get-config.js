export default async (hdbCore) => {
  return hdbCore.requestWithoutAuthentication({
    body: {
      operation: 'get_configuration'
    }
  })
}
