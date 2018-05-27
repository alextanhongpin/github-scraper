const DataStore = require('nedb')

function datastore (name) {
  return new DataStore({
    filename: `./db/${name}`,
    autoload: true,
    timestampData: true
  })
}

module.exports = {
  users: datastore('users'),
  repos: datastore('repos')
}
