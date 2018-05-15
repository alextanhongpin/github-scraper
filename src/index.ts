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
import * as cron from 'node-cron'

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
  async function cronService (): Promise<boolean> {
    const DAYS = 1000 * 60 * 60 * 24
    // For safety, take those that one day earlier
    const startTimestamp: number = (await userService.lastCreated({})).timestamp - DAYS
    const currentTimestamp: number = new Date().getTime()
    const targetedTimestamp: number = startTimestamp + (180 * DAYS)
    const endTimestamp: number = targetedTimestamp > currentTimestamp ? currentTimestamp : targetedTimestamp
    console.log(`#range start = ${startTimestamp} end = ${endTimestamp}`)
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
    const savedRepos = await repoService.createMany({ repos })
    console.log(`event=save_repos saved=${savedRepos.repos.length} fetched=${repos.length}`)

    // Save users
    const savedUsers = await userService.createMany({ users: userInfos })
    console.log(`event=save_users saved=${savedUsers.users.length} fetched=${userInfos.length}`)
    return true
  }

  // cron.schedule('0 12 * * *', async function() {
    // console.log('#cron running a task every day at 12:00 a.m.')
    // try {
    //   const ok = await cronService()
    //   console.log('cron: success', ok)
    // } catch (error) {
    //   console.log('cron error:', error.message)
    // }
  // }, false)

  // Update Service is responsible for updating user's information
  async function updateService () {
    db.users.find({}).sort({ updated_at: 1 }).limit(50).exec(async (error: Error, docs: any) => {
      const logins = docs.map((doc: any) => doc.login)
      console.log(logins)

      const retry = Retry({
        maxRetry: 10,
        timeout: 'exponential',
        timeoutInterval: '1m'
      })
      const results = await Bluebird.all(logins).map(async (login: string) => {
        try {
          const user = await userService.fetchOne({ login })
          const newUser = await userService.createMany({
            users: [user]
          })
          console.log(`#updateService: updating ${login}`)
          const results = await repoService.getReposAndUpdate({ retry }, { login, page: 1 })
          return results
        } catch (error) {
          console.log(`#updateService: login=${login} error=${error}`)
          return null
        }
      }, { concurrency: 5 })
      const successes = results.filter((nonNull: any) => nonNull !== null)
      console.log(`updated ${successes.length} out of ${logins.length} users`)
    })
  }

  // updateService()

  app.get('/', async (req, res) => {
    res.status(200).json({
      routes: app.routes
    })
  })

  app.get('/users', async (req, res) => {
    const { limit = 10, offset = 0 } = req.query
    const [users, countResponse] = await Promise.all([
      userService.all({ limit, offset }),
      userService.count({})
    ])
        
    res.status(200).json({
      data: users,
      count: countResponse.totalCount
    })
  })

  app.get('/users/:login', async (req, res) => {
    const user = await userService.getOne({ login: req.params.login })
    res.status(200).json({
      data: user
    })
  })

  app.get('/repos', async (req, res) => {
    const { limit = 10, offset = 0 } = req.query
    const repos = await repoService.all({
      limit, offset
    })
    res.status(200).json({
      data: repos
    })
  })

  app.get('/repos/:login', async (req, res) => {
    const { login } = req.params
    const { exclude_fork: excludeFork } = req.query
    const repos = await repoService.allByUser({ login })
    const filteredRepos = repos
    .filter((repo: any) => excludeFork === 'true' ? !repo.fork : true)
    .map((repo: any) => {
      const { owner, name, description, size, stargazers_count, watchers_count, language, forks_count } = repo
      return {
        login: owner.login,
        name,
        description,
        size,
        stargazers_count,
        watchers_count,
        language,
        forks_count
      }
    })
    res.status(200).json({
      data: filteredRepos,
      count: filteredRepos.length
    })
  })

  app.get('/github/repos/:login', async (req, res) => {
    const { login } = req.params
    const page = Number(req.query.page)
    // Create the user entry if user does not exist. Updates existing ones.
    const user = await userService.fetchOne({ login })
    const newUser = await userService.createMany({
      users: [user]
    })

    // Setup Retry
    const retry = Retry({
      maxRetry: 10,
      timeout: 'exponential',
      timeoutInterval: '1m'
    })
    const repos = await repoService.getReposAndUpdate({ retry }, { login, page })
    res.status(200).json({
      user: newUser,
      repos: repos
    })
  })

  app.listen(config.get('port'), () => {
    console.log(`listening to port *:${config.get('port')}. press ctrl + c to cancel`)
  })

  return app
}

main().catch(console.log)
