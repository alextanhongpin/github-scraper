/*
 * src/index.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/


import * as express from 'express'
import * as bodyParser from 'body-parser'
import config from './config'
// import DB from './database'
import db from './database/nedb'

import Schema from './schema'
import FoodService from './github-service'

async function main () {
  const app: express.Application = express()
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  // const db = await DB.connect(config.get('db'))
  const schema = Schema()

  const services = [
    FoodService
  ].map(service => service({ schema, config, db }))

  // Initialize service by looping through them
  services.forEach((service) => {
    app.use(service.basePath, service.route)
  })

  app.get('/', async (req, res) => {
    res.status(200).json({
      endpoints: services.map((service) => service.info),
      routes: app.routes
    })
  })

  // This is a naive example, but you can create an endpoint to toggle the services (on/off)
  // app.get('/toggle', (req, res) => {
  //   const on = config.get('service.food')
  //   config.set('service.food', !on)
  //   res.status(200).json({
  //     on
  //   })
  // })

  app.listen(config.get('port'), () => {
    console.log(`listening to port *:${config.get('port')}. press ctrl + c to cancel`)
  })

  return app
}

main().catch(console.log)
