export const getApiUrl = () => {
  const location = window.location.origin + window.location.pathname
  return `${location.replace('/static', '')}`
  // return 'https://10.1.2.3:9926/mongo-migrator/' # For debugging
}
