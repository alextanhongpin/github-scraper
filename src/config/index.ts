/*
 * src/config/index.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

// The default config of the application that is obtained from environment variables

import* as convict from 'convict'

const config = convict({
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 5000,
    env: 'PORT'
  },
  accessToken: {
    doc: 'The Github Access Token',
    format: String,
    default: process.env.ACCESS_TOKEN,
    env: 'ACCESS_TOKEN'
  },
  perPage: {
    doc: 'The maximum item per page for Github result',
    format: Number,
    default: 30
  },
  country: {
    doc: 'The country the Github users reside',
    format: String,
    default: 'Malaysia'
  },
  githubCreatedAt: {
    doc: 'The date Github is published - used as default date when none is found',
    format: String,
    default: new Date(2008, 3, 1).toString()
  }
})

const validated = config.validate({ allowed: 'strict' })

export default validated
