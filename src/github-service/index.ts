/*
 * src/food-service/index.js
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 17/10/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import { Router } from 'express'
import Store from './store'
import Model from './model'
import Route from './route'

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
