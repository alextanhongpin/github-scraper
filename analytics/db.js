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

module.exports = {
  users,
  repos
}
