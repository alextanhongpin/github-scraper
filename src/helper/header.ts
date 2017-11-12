export default function buildHeader (accessToken?: string): any {
  const headerWithToken = {
    'Authorization': `token ${accessToken}`
  }
  const headerWithUserAgent = {
    'User-Agent': 'request'
  }
  return accessToken ? {...headerWithToken, ...headerWithUserAgent} : headerWithUserAgent
}