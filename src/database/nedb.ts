import * as DataStore from 'nedb'

function datastore (name: string): any {
  return new DataStore({
    filename: `./db/${name}`,
    autoload: true,
    timestampData: true
  })
}

export default {
  users: datastore('users'),
  repos: datastore('repos')
}