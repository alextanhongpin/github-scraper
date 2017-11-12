/*
 * src/github-service/store.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as moment from 'moment'
import * as fs from 'fs'
import { promisify } from 'util'
import { DefaultCircuitBreaker } from '../helper/circuit-breaker'
import { 
  GetRepoRequest, GetRepoResponse,
  GetUserRequest, GetUserResponse,
  SearchRequest, SearchResponse
} from './interface'

interface StoreParams {
  config: any;
  db: any;
}


const githubCreatedAt = new Date(2008, 3, 1) // April 2008

function Store ({ config, db }: StoreParams) {
  const githubToken = config.get('accessToken')
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

  async function saveRepos (data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      db.repos.insert(data, (error: Error, newDoc: any) => {
        error ? reject(error) : resolve(newDoc)
      })
    })
  }

  async function saveUsers (data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      db.users.insert(data, (error: Error, newDoc: any) => {
        error ? reject(error) : resolve(newDoc)
      })
    })
  }

  async function getUsers (): Promise<any> {
    return new Promise((resolve, reject) => {
      db.users.find({}, (error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      })
    })
  }

  async function checkUserExist ({ id }: { id: number }): Promise<any> {
    return new Promise((resolve, reject) => {
      db.users.findOne({ id }, (error: Error, user: any) => {
        error ? reject(error) : resolve(user)
      })
    })
  }

  async function updateUser (params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      db.users.update({ id: params.id }, params, {}, (error: Error, numReplaced: number) => {
        error ? reject(error) : resolve(numReplaced)
      })
    })
  }

  async function lastUpdatedUser (params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      db.users.findOne({}).sort({ createdAt: -1 }).limit(1).exec((error: Error, docs: any) => {
        error ? reject(error) : resolve(new Date(docs && docs.created_at || githubCreatedAt).getTime())
      })
    })
  }

  async function getRepos (): Promise<any> {
    return new Promise((resolve, reject) => {
      db.repos.find({}, (error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      })
    })
  }

  async function checkRepoExist ({ id }: { id: number }): Promise<any> {
    return new Promise((resolve, reject) => {
      db.repos.findOne({ id }, (error: Error, repo: any) => {
        error ? reject(error) : resolve(repo)
      })
    })
  }

  async function updateRepo (params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      db.repos.update({ id: params.id }, params, {}, (error: Error, numReplaced: number) => {
        error ? reject(error) : resolve(numReplaced)
      })
    })
  }

  async function lastUpdatedRepo (params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      db.repos.findOne({}).sort({ createdAt: -1 }).limit(1).exec((error: Error, docs: any) => {
        error ? reject(error) : resolve(new Date(docs && docs.created_at || githubCreatedAt).getTime())
      })
    })
  }

  async function countRepo (params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      db.repos.count({}, (error: Error, count: any) => {
        error ? reject(error) : resolve(count)
      })
    })
  }

  async function countUser (params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      db.users.count({}, (error: Error, count: any) => {
        error ? reject(error) : resolve(count)
      })
    })
  }

  return {
    oneRepo,
    oneUser,
    search,
    saveRepos,
    saveUsers,
    getUsers,
    getRepos,
    checkUserExist,
    checkRepoExist,
    updateUser,
    updateRepo,
    lastUpdatedRepo,
    lastUpdatedUser,
    countUser,
    countRepo
  }
}

export default (params?: any) => Store(params)
