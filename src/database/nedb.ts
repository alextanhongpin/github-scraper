import * as DataStore from 'nedb'

function datastore (name: string): any {
  return new DataStore({
    filename: `./db/${name}`,
    autoload: true,
    timestampData: true
  })
}

const users = datastore('users')
// The user login has to be unique
users.ensureIndex({ fieldName: 'login', unique: true }, (error: Error) => {
  console.log(`#database db=users event=set login field to unique error=${error && error.message}`)
})

const repos = datastore('repos')
// The full name of the repository, e.g. alextanhongpin/hello-world must be unique
// This won't clash if other users have repository of similar name johndoe/hello-world
repos.ensureIndex({ fieldName: 'full_name', unique: true }, (error: Error) => {
  console.log(`#database db=repos event=set full_name field to unique error=${error && error.message}`)
})

export default {
  users,
  repos
}