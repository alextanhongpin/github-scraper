/*
 * src/food-service/store.js
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 17/10/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as moment from 'moment'
import { DefaultCircuitBreaker } from '../helper/circuit-breaker'
import { 
  GetRepoRequest, GetRepoResponse,
  GetUserRequest, GetUserResponse,
  SearchRequest, SearchResponse
} from './interface'

const GithubStore = (githubToken?: string) => {
  const headerWithToken = {
    'Authorization': `token ${githubToken}`
  }
  const headerWithUserAgent = {
    'User-Agent': 'request'
  }
  const defaultHeader = githubToken ? {...headerWithToken, ...headerWithUserAgent} : headerWithUserAgent

  async function oneRepo ({ login, page=1 }: GetRepoRequest): Promise<GetRepoResponse> {
    const options = {
      url: `https://api.github.com/users/${login}/repos?page=${page}`,
      headers: defaultHeader,
      json: true
    }
    return DefaultCircuitBreaker(options)
  }

  async function oneUser ({ login }: GetUserRequest): Promise<GetUserResponse> {
    const options = {
      url: `https://api.github.com/users/${login}`,
      headers: defaultHeader,
      json: true
    }
    return DefaultCircuitBreaker(options)
  }

  async function search ({ country='malaysia', startTimestamp=Date.now(), endTimestamp=Date.now(), page=1 }: SearchRequest): Promise<SearchResponse> {
    const start: string = moment(startTimestamp).format('YYYY-MM-DD')
    const end: string = moment(endTimestamp).format('YYYY-MM-DD')
    const options = {
      url: `https://api.github.com/search/users?q=location:${country} created:${start}..${end}&page=${page}`,
      headers: defaultHeader,
      json: true
      // resolveWithFullResponse: true
    }
    return DefaultCircuitBreaker(options)
  }

  return {
    oneRepo,
    oneUser,
    search
  }
}

export default (githubToken?: string) => GithubStore(githubToken)
