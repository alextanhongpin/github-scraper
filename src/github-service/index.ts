/*
 * src/github-service/index.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import { Router } from 'express'
import * as cron from 'node-cron'
import * as Bluebird from 'bluebird'

import Store from './store'
import Model from './model'
import Route from './route'
import Transport from './transport'

import * as  express from 'express'
const router: Router = express.Router()

interface ServiceParams {
  config: any;
  schema: any;
  db: any;
}

function Service({ schema, config, db }: ServiceParams) {
  const model = Model({
    store: Store({ config, db }),
    schema
  })

  model.countRepo({}).then((count: number) => {
    console.log('repo count', count)
  })


  model.countUser({}).then((count: number) => {
    console.log('user count', count)
  })

  const transport = Transport(model)
  // cron.schedule('* * * * *', () => {
    // console.log('running every minute')
    
  // })
  // Initial load for 5 years (half-year interval)
  // Bluebird.all(Array(5).fill(0)).map(_ => {
  //   return transport().then(console.log).catch(console.error)
  // }, { concurrency: 1 })

  return router
}



export default (options: any) => {
  return {
    basePath: '/github',
    info: {
      name: 'Food Service',
      service: 'food',
      version: '1.0.0',
      description: 'Endpoint service the github service',
      paths: {
        // one: {
        //   method: 'GET',
        //   path: '/foods/:id'
        // },
        // all: {
        //   method: 'GET',
        //   path: '/foods'
        // },
        // create: {
        //   method: 'POST',
        //   path: '/foods'
        // }
      }
    },
    route: Service(options)
  }
}
