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
  db: {
    host: {
      doc: 'mysql database hostname',
      format: String,
      default: 'localhost',
      env: 'DB_HOST'
    },
    database: {
      doc: 'mysql database name',
      format: String,
      default: 'testdb',
      env: 'DB_NAME'
    },
    user: {
      doc: 'mysql database username',
      format: String,
      default: 'user',
      env: 'DB_USER'
    },
    password: {
      doc: 'mysql database password',
      format: String,
      default: '123456',
      env: 'DB_PASS'
    },
    port: {
      doc: 'mysql database port',
      format: 'port',
      default: '3306',
      env: 'DB_PORT'
    }
  },
  service: {
    food: {
      doc: 'Feature toggle for food service',
      format: Boolean,
      default: true,
      env: 'FOOD_SERVICE'
    }
  }
})

const validated = config.validate({ allowed: 'strict' })

export default validated
