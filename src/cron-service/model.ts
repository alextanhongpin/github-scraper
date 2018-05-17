import * as Bluebird from 'bluebird'

// Interfaces
import { User } from "../user-service/interface";

// Helpers
import { generatePages } from '../helper/page'
import Retry from '../helper/circuit-retry'

// Constants
const DAYS = 1000 * 60 * 60 * 24

const Model = (config: any, db: any, repoService: any, searchService: any, userService: any, analyticService: any) => {

  async function fetchUsers () {
    const country = config.get('country')
    const perPage = config.get('perPage')
    
    // For safety, take those that one day earlier
    const startTimestamp: number = (await userService.lastCreated({})).timestamp - DAYS
    const currentTimestamp: number = new Date().getTime()
    const targetedTimestamp: number = startTimestamp + (180 * DAYS)
    const endTimestamp: number = targetedTimestamp > currentTimestamp ? currentTimestamp : targetedTimestamp
    console.log(`#range start = ${startTimestamp} end = ${endTimestamp}`)

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
    const logins: string[] = users.map((user: User) => user.login)

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
  }

  // updateUser is responsible for updating user's information
  async function updateUsers () {
    const statement = db.users
      .find({})
      .sort({ 
        fetched_at: 1,
        updated_at: 1
      })
      .limit(30)

    statement.exec(async (error: Error, docs: any) => {
      const logins = docs.map((doc: any) => doc.login)
      console.log(`#updateService logins =`, logins)
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
          if (error.message === '404 - {"message":"Not Found","documentation_url":"https://developer.github.com/v3/users/#get-a-single-user"}') {
            await userService.remove(login)
            console.log(`#updateService event=removing_user login=${login}`)
          }
          return null
        }
      }, { concurrency: 5 })
      const successes = results.filter((nonNull: any) => nonNull !== null)
      console.log(`updated ${successes.length} out of ${logins.length} users`)
    })
  }

  async function buildAnalytics () {
    return analyticService.buildAnalytics()
  }

  async function buildProfile () {
    return analyticService.buildUserProfile()
  }

  return {
    fetch: fetchUsers,
    update: updateUsers,
    analytic: buildAnalytics,
    profile: buildProfile
  }
}

export default Model