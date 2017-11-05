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
import Store from './store'
import Model from './model'
import Route from './route'
import Transport from './transport'

import * as  express from 'express'
const router: Router = express.Router()

const Service = ({ schema }: { schema: any }) => {
  const model = Model({
    store: Store(),
    schema
  })
  const route = Route(model)

  router
  .use(route.featureToggle)
  .get('/users/:id', route.getUser)
  .get('/repos/:id', route.getRepo)
  .get('/search', route.search)

  const transport = Transport(model)
  transport.then(console.log).catch(console.error)

  return router
}

export default (options: any) => {
  return {
    basePath: '/github',
    info: {
      name: 'Food Service',
      service: 'food',
      version: '1.0.0',
      description: 'Endpoint service the food service',
      paths: {
        one: {
          method: 'GET',
          path: '/foods/:id'
        },
        all: {
          method: 'GET',
          path: '/foods'
        },
        create: {
          method: 'POST',
          path: '/foods'
        }
      }
    },
    route: Service(options)
  }
}
