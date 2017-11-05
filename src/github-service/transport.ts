/*
 * src/github-service/transport.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/
import * as Promise from 'bluebird'
import { 
  GetRepoRequest, GetRepoResponse,
  GetUserRequest, GetUserResponse,
  SearchRequest, SearchResponse
} from './interface'

export default function transport(model: any): Promise<any> {
  // The maximum number of items displayed by github
  const PER_PAGE: number = 30
  const START_TIMESTAMP: number = new Date(2017, 10, 5).getTime()
  const END_TIMETAMP: number = Date.now()
  const COUNTRY = 'malaysia'

  // The first pipeline gets the page count of the search result
  async function getSearchPageCount (): number {
    const request: SearchRequest = {
      country: COUNTRY,
      page: 1,
      startTimestamp: START_TIMESTAMP,
      endTimestamp: END_TIMETAMP
    }
    const response: SearchResponse = await model.search(request)
    return response.total_count
  }

  // The second pipeline get's the users by the page
  async function searchUsersByPage (page: number): any[] {
    const request: SearchRequest = {
      page,
      country: COUNTRY,
      startTimestamp: START_TIMESTAMP,
      endTimestamp: END_TIMETAMP
    }
    const response: SearchResponse = await model.search(request)
    return response.items
  }

  // The third pipeline will get more information on the user based on the user's Github login id
  async function getUserInfo (login: string): GetUserResponse {
    const request: GetUserRequest = {
      login
    }
    const response: GetUserResponse = await model.oneUser(request)
    return response
  }

  async function getRepo ({ page, login }: { page: number, login: string }): GetRepoResponse {
    const request: GetRepoRequest = {
      login,
      page
    }
    const response: GetUserResponse = await model.oneRepo(request)
    return response
  }

  async function getRepos ({ public_repos, login }: { public_repos: number, login: string }): GetRepoResponse {
    const pages = generatePages(public_repos, PER_PAGE)
    const repos = await Promise.all(pages).map(page => getRepo({ page, login }), { concurrency: 20 })
    return flatten(repos)
  }

  // The orchestration of the whole pipeline
  async function main () {
    const totalCount = await getSearchPageCount()
    const searchPages = generatePages(totalCount, PER_PAGE)

    // For each pages, scrape the user's data
    const usersArray = await Promise.all(searchPages).map(searchUsersByPage, { concurrency: 20 })
    const users: SearchItem[] = flatten(usersArray)

    // Take only the user's login in order to get more details
    const logins: string[] = users.map(user => user.login)

    // Get all the user's information and store it
    const usersInfo: GetUserResponse[] = await Promise.all(logins).map(getUserInfo, { concurrency: 20 })

    const userRepoInfo = usersInfo.map(user => ({ public_repos: user.public_repos, login: user.login }))
    // For each of the user's, scrape the repo
    const reposArray: GetRepoResponse[] = await Promise.all(userRepoInfo).map(getRepo, { concurrency: 20 })
    const repos: GetRepoResponse = flatten(reposArray)

    console.log('...saving repos to file')
    await model.saveRepos(repos)
    console.log('done saving repos')

    console.log('...saving users to file')
    await model.saveUsers(usersInfo)
    console.log('done saving users')
  }

  return main()
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