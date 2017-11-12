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
import Retry from './helper/circuit-retry'

import config from './config'
import db from './database/nedb'

// Github Service is composed of the following services
import SearchService from './search-service'
import UserService from './user-service'
import RepoService from './repo-service'
import { generatePages } from './helper/page'

async function main () {
  const app: express.Application = express()
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  const searchService = SearchService({ config })
  const userService = UserService({ config, db })
  const repoService = RepoService({ config, db })

  // Transport
  async function cron (): Promise<boolean> {
    const DAYS = 1000 * 60 * 60 * 24
    const startTimestamp: number = Math.min(...[
      (await userService.lastCreated({})).timestamp, 
      (await repoService.lastCreated({})).timestamp
    ])
    const endTimestamp: number = startTimestamp + (180 * DAYS)
    const country = config.get('country')
    const perPage = config.get('perPage')
  
    // Setup Retry
    const retry = Retry({
      maxRetry: 10,
      timeout: 'exponential',
      timeoutInterval: '1m'
    })
    let count: number = 0
    retry.on('error', (error: Error) => {
      count += 1
      console.log(`error=${error.message} count=${count}`)
    })

    console.log('event=start')
    // Check the number of search results page
    const { totalCount } = await searchService.fetchCount({
      country,
      startTimestamp,
      endTimestamp,
      page: 1
    })

    // Returns an array of pages based on the total count and number of items per page
    const pages = generatePages(totalCount, perPage)
    console.log(`event=generate_page totalCount=${totalCount} pages=${pages.length}`)

    // For each page from the search result, get the users
    const ctx = { retry }
    const { users } = await searchService.fetchUsers(ctx, { 
      search: { 
        country,
        startTimestamp,
        endTimestamp
      },
      pages
    })
    console.log(`event=fetch_users users=${users.length}`)

    // Take only the user's login in order to get more details on the user
    const logins: string[] = users.map((user) => user.login)

    // Fetch the users information
    const { users: userInfos } = await userService.fetchMany(ctx, { logins })

    // For each users, get the total number of repos and the login id
    const userRepoInfos = userInfos.map(({ public_repos, login }: { public_repos: number, login: string }) => { 
      return {
        login,
        totalCount: public_repos
      }
    })
    const { repos } = await repoService.fetchAllForUsers(ctx, { users: userRepoInfos })

    // Save repos
    const { repos: savedRepos } = await repoService.createMany({ repos })
    console.log(`event=save_repos saved=${savedRepos.length} fetched=${repos.length}`)

    // Save users
    const { users: savedUsers } = await userService.createMany({ users: userInfos })
    console.log(`event=save_users saved=${savedUsers.length} fetched=${userInfos.length}`)
    return true
  }

  cron().then((ok) => {
    console.log('cron: success', ok)
  }).catch((error) => {
    console.log('cron error:', error.message)
  })

  app.get('/', async (req, res) => {
    res.status(200).json({
      routes: app.routes
    })
  })

  app.listen(config.get('port'), () => {
    console.log(`listening to port *:${config.get('port')}. press ctrl + c to cancel`)
  })

  return app
}

main().catch(console.log)
