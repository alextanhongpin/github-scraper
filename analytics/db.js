const DataStore = require('nedb')

function datastore (name) {
  return new DataStore({
    filename: `./db/${name}`,
    autoload: true,
    timestampData: true
  })
}

const users = datastore('users')
const repos = datastore('repos')
const profiles = datastore('profiles')
const analytics = datastore('analytics')

module.exports = {
  users,
  repos,
  profiles,
  analytics
}
