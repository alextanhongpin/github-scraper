/*
 * src/database/nedb.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 13/05/2018
 * Copyright (c) 2018 alextanhongpin. All rights reserved.
**/

// Contains the init function for the local storage using nedb

import * as DataStore from 'nedb'

function datastore (name: string): any {
  return new DataStore({
    filename: `./db/${name}`,
    autoload: true,
    timestampData: true
  })
}

const users = datastore('users')
const repos = datastore('repos')

// Set the user's `login` field to be unique
users.ensureIndex({ fieldName: 'login', unique: true }, (error: Error) => {
  console.log(`#database db=users event=set login field to unique error=${error && error.message}`)
})

// Set the repo's `full_name`, e.g. alextanhongpin/hello-world to be unique
// This won't clash if other users have repository of similar name johndoe/hello-world
repos.ensureIndex({ fieldName: 'full_name', unique: true }, (error: Error) => {
  console.log(`#database db=repos event=set full_name field to unique error=${error && error.message}`)
})

export default {
  users,
  repos
}