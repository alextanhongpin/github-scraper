/*
 * src/github-service/transport.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/
import * as Bluebird from 'bluebird'
import * as ProgressBar from 'progress'
import Retry from 'circuit-retry'

import { 
  GetRepoRequest, GetRepoResponse,
  GetUserRequest, GetUserResponse,
  SearchRequest, SearchResponse,
  SearchItem
} from './interface'

export default function Transport(model: any): Function {
  const PER_PAGE: number = 30

  // The first pipeline gets the page count of the search result
  async function getSearchPageCount ({ startTimestamp, endTimestamp, country }: any): Promise<number> {
    const request: SearchRequest = {
      country,
      startTimestamp,
      endTimestamp,
      page: 1
    }
    const response: SearchResponse = await model.search(request)
    return response.total_count
  }

  // The second pipeline get's the users by the page
  async function searchUsersByPage ({ page, country, startTimestamp, endTimestamp }: any): Promise<any[]> {
    const request: SearchRequest = {
      page,
      country,
      startTimestamp,
      endTimestamp
    }
    const response: SearchResponse = await model.search(request)
    return response.items
  }

  // The third pipeline will get more information on the user based on the user's Github login id
  async function getUserInfo (login: string): Promise<GetUserResponse> {
    const request: GetUserRequest = {
      login
    }
    const response: GetUserResponse = await model.oneUser(request)
    return response
  }

  async function getRepo ({ page, login }: { page: number, login: string }): Promise<GetUserResponse> {
    const request: GetRepoRequest = {
      login,
      page
    }
    const response: GetUserResponse = await model.oneRepo(request)
    return response
  }

  async function getRepos ({ public_repos, login }: { public_repos: number, login: string }): Promise<GetRepoResponse> {
    const pages = generatePages(public_repos, PER_PAGE)
    const repos: any[] = await Bluebird.all(pages).map((page: number) => getRepo({ page, login }), { concurrency: 20 })
    return flatten(repos)
  }

  // The orchestration of the whole pipeline
  async function main () {
    const startTimestamp: number = Math.min(...[await model.lastUpdatedRepo(), await model.lastUpdatedUser()])
    const endTimestamp: number = startTimestamp + (1000 * 60 * 60 * 24 * 180) // a year 
    console.log(new Date(startTimestamp), new Date(endTimestamp))
    const country = 'malaysia'
    const retry = Retry({
      maxRetry: 10,
      timeout: 'exponential',
      timeoutInterval: '1m'
    })
    let counter = 0
    retry.on('error', (error: Error) => {
      counter += 1
      // if (counter % 5 === 0) {
        console.log('error:', error.message)
      // }
      console.log(`error_counter=${counter}`)
    })
    console.log('...initializing')
    const totalCount = await getSearchPageCount({
      startTimestamp,
      endTimestamp,
      country
    })
    const searchPages = generatePages(totalCount, PER_PAGE)
    console.log(`event=search_pages total_count=${totalCount} count=${searchPages.length}`)

    // For each pages, scrape the user's data
    const usersProgressBar = new ProgressBar(':bar', { total: searchPages.length })
    const usersArray = await Bluebird.all(searchPages).map((page, i) => {
      usersProgressBar.tick()
      return retry.do(searchUsersByPage, { page, country, startTimestamp, endTimestamp })
    }, { concurrency: 1 })
    const users: SearchItem[] = flatten(usersArray)
    console.log(`event=search_users count=${users.length}`)

    // Take only the user's login in order to get more details
    const logins: string[] = users.map(user => user.login)

    // Get all the user's information and store it
    const usersInfoProgressBar = new ProgressBar(':bar', { total: logins.length })
    const usersInfo: GetUserResponse[] = await Bluebird.all(logins).map((user, i) => {
      usersInfoProgressBar.tick()
      if (usersInfoProgressBar.complete) {
        console.log('\ncomplete\n')
      }
      return retry.do(getUserInfo, user)
    }, { concurrency: 3 })
    console.log(`event=get_userinfos count=${usersInfo.length}`)
    const userRepoInfo = usersInfo.map(user => ({ public_repos: user.public_repos, login: user.login }))
    
    // For each of the user's, scrape the repo
    const reposProgressBar = new ProgressBar(':bar', { total: logins.length })
    const reposArray: any[] = await Bluebird.all(userRepoInfo).map((repo, i) => {
      reposProgressBar.tick()
      return retry.do(getRepo, repo)
    }, { concurrency: 5 })
    console.log(`event=get_repos count=${reposArray.length}`)
    const repos: GetRepoResponse[] = flatten(reposArray)

    const saveReposResponse = await model.insertBulkRepos(repos)
    console.log(`event=save_repos target=${repos.length} saved=${saveReposResponse.length}`)

    const usersinfoResponse = await model.insertBulkUsers(usersInfo)
    console.log(`event=save_users target=${usersInfo.length} saved=${usersinfoResponse.length}`)
  }

  return main
}

// Flattens 2-dimensional array into a 1-dimensional array
function flatten(x: any[][]): any[] {
  return x.reduce((a, b) => a.concat(b), [])
}

// Generate an array of pages based on the total count of items and the maximum number of
// items per page
function generatePages (totalCount: number, perPage: number): number[] {
  const pages = Math.ceil(totalCount / perPage)
  return Array(pages).fill(0).map((_, page) => page + 1)
}