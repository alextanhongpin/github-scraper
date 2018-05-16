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
import * as Bluebird from 'bluebird'

import * as moment from 'moment'

import config from './config'
import db from './database/nedb'

// Github Service is composed of the following services
import SearchService from './search-service'
import UserService from './user-service'
import RepoService from './repo-service'
import CronService from './cron-service'

// Routes
import RepoRoutes from './repo-service/route'
import UserRoutes from './user-service/route'

// Helpers
import { generatePages } from './helper/page'
import Retry from './helper/circuit-retry'

async function main () {
  const app: express.Application = express()
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  const searchService = SearchService({ config })
  const userService = UserService({ config, db })
  const repoService = RepoService({ config, db })
  const cronService = CronService(config, db, repoService, searchService, userService)

  const fetchCron = cronService.fetch(config.get('cron.fetch'))
  const updateCron = cronService.update(config.get('cron.update'))

  if (config.get('cron.enableFetch')) {
    fetchCron.start()
  }
  if (config.get('cron.enableUpdate')) {
    updateCron.start()
  }

  console.log(`#cron name=fetch enabled=${config.get('cron.enableFetch')} tab="${config.get('cron.fetch')}"`)
  console.log(`#cron name=update enabled=${config.get('cron.enableUpdate')} tab="${config.get('cron.update')}"`)

  app.get('/', async (req, res) => {
    res.status(200).json({
      routes: app.routes
    })
  })

  app.use('/repos', RepoRoutes(repoService))
  app.use('/users', UserRoutes(userService))

  // app.get('/github/repos/:login', async (req, res) => {
  //   const { login } = req.params
  //   const page = Number(req.query.page)
  //   // Create the user entry if user does not exist. Updates existing ones.
  //   const user = await userService.fetchOne({ login })
  //   const newUser = await userService.createMany({
  //     users: [user]
  //   })

  //   // Setup Retry
  //   const retry = Retry({
  //     maxRetry: 10,
  //     timeout: 'exponential',
  //     timeoutInterval: '1m'
  //   })
  //   const repos = await repoService.getReposAndUpdate({ retry }, { login, page })
  //   res.status(200).json({
  //     user: newUser,
  //     repos: repos
  //   })
  // })

  app.listen(config.get('port'), () => {
    console.log(`listening to port *:${config.get('port')}. press ctrl + c to cancel`)
  })

  return app
}

main().catch(console.log)
