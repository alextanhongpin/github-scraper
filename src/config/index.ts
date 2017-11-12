/*
 * src/config/index.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as convict from 'convict'

const config = convict({
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: process.env.PORT,
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
  }
})

const validated = config.validate({ allowed: 'strict' })

export default validated
