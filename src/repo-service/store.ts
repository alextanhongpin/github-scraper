/*
 * src/repo-service/store.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 12/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as request from 'request-promise'
import buildHeader from '../helper/header'

import { 
  Repo,
  RepoStore,
  FetchAllRequest,
  FetchAllResponse,
  AllRequest,
  AllResponse,
  AllByUserRequest,
  AllByUserResponse,
  CreateRequest, 
  CreateResponse,
  CheckExistRequest,
  CheckExistResponse,
  UpdateRequest,
  UpdateResponse,
  LastCreatedRequest,
  LastCreatedResponse,
  CountRequest,
  CountResponse,
  GetReposRequest,
  GetReposResponse,
  GetRepoCountByLoginRequest,
  GetRepoCountByLoginResponse,
  GetLastRepoByLoginRequest,
  GetLastRepoByLoginResponse,
  GetReposSinceRequest,
  GetReposSinceResponse,
  CreateOneRequest,
  CreateOneResponse
} from './interface'

const Store = ({ config, db }: { config: any, db: any }): RepoStore => {

  const githubCreatedAt = new Date(2008, 3, 1) // April 2008

  // fetchAll will fetch a list of paginated repos (default 30 items per page, page starting at index 1) by user login
  async function fetchAll ({ login, page=1 }: FetchAllRequest): Promise<FetchAllResponse> {
    const options = {
      url: `https://api.github.com/users/${login}/repos?page=${page}`,
      headers: buildHeader(config.get('accessToken')),
      json: true
    }
    return request(options)
  }

  // getRepos will return additional information for repos such as total_count, which could be useful
  // for scraping by page
  async function getRepos ({ login, page=1 }: GetReposRequest): Promise<GetReposResponse> {
    const options = {
      url: `https://api.github.com/search/repositories?q=user:${login}&page=${page}&sort=updated&order=desc`,
      headers: buildHeader(config.get('accessToken')),
      json: true
    }
    return request(options)
  }

  async function all ({ offset, limit }: AllRequest): Promise<AllResponse> {
    return new Promise<AllResponse>((resolve, reject) => {
      db.repos.find({}).skip(offset).limit(limit).exec((error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      })
    })
  }

  async function allByUser ({ login }: AllByUserRequest): Promise<AllByUserResponse> {
    return new Promise<AllByUserResponse>((resolve, reject) => {
      db.repos.find({ 'owner.login': login }, (error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      })
    })
  }

  async function create (req: CreateRequest): Promise<CreateResponse> {
    return new Promise<CreateResponse>((resolve, reject) => {
      db.repos.insert(req.repos, (error: Error, newDoc: any) => {
        console.log(`#repoStore.create newDoc = ${newDoc.length}`)
        error ? reject(error) : resolve({ repos: newDoc })
      })
    })
  }

  async function createOne (req: CreateOneRequest): Promise<CreateOneResponse> {
    return new Promise<CreateOneResponse>((resolve, reject) => {
      db.repos.insert(req.repo, (error: Error, newDoc: any) => {
        console.log(`#repoStore.createOne newDoc =`, newDoc && newDoc.id)
        error ? reject(error) : resolve({ repo: newDoc })
      })
    })
  }

  async function checkExist ({ id, login }: CheckExistRequest): Promise<CheckExistResponse> {
    return new Promise<CheckExistResponse>((resolve, reject) => {
      db.repos.findOne({ 
        id,
        'owner.login': login
      }, (error: Error, repo: any) => {
        error ? reject(error) : resolve(repo)
      })
    })
  }

  async function update (req: UpdateRequest): Promise<UpdateResponse> {
    return new Promise<UpdateResponse>((resolve, reject) => {
      db.repos.update({ id: req.id }, req, {}, (error: Error, numReplaced: number) => {
        error ? reject(error) : resolve({ numReplaced })
      })
    })
  }

  async function lastCreated (req: LastCreatedRequest): Promise<LastCreatedResponse> {
    return new Promise<LastCreatedResponse>((resolve, reject) => {
      db.repos.findOne({})
        .sort({ createdAt: -1 })
        .limit(1)
        .exec((error: Error, docs: any) => {
          error ? reject(error) : resolve({ timestamp: new Date(docs && docs.created_at || githubCreatedAt).getTime() })
        })
    })
  }

  // Get the total count of all the repos in the storage
  async function count (req: CountRequest): Promise<CountResponse> {
    return new Promise<CountResponse>((resolve, reject) => {
      db.repos.count({}, (error: Error, count: any) => {
        error ? reject(error) : resolve({ totalCount: count })
      })
    })
  }

  // Get the total count of the repos by login
  async function getRepoCountByLogin (req: GetRepoCountByLoginRequest): Promise<GetRepoCountByLoginResponse> {
    return new Promise<GetRepoCountByLoginResponse>((resolve, reject) => {
      db.repos.count({
        'owner.login': req.login,
        fork: req.is_forked
      }, (error: Error, total_count: number) => {
        error ? reject(error) : resolve({ total_count })
      })    
    })
  }

  // Get the created at date of the last repo by login
  async function getLastRepoByLogin(req: GetLastRepoByLoginRequest): Promise<GetLastRepoByLoginResponse> {
    return new Promise<GetLastRepoByLoginResponse>((resolve, reject) => {
      db.repos.findOne({ 'owner.login': req.login }).sort({ created_at: -1 }).exec((error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      }) 
    })
  }

  // Get repos that are created by a particular user after the given date
  async function getReposSince ({ login, page=1, start, end }: GetReposSinceRequest): Promise<GetReposSinceResponse> {
    const options = {
      url: `https://api.github.com/search/repositories?q=user:${login} created:${start}..${end}&page=${page}&sort=updated&order=desc`,
      headers: buildHeader(config.get('accessToken')),
      json: true
    }
    return request(options)
  }

  return {
    all,
    allByUser,
    getRepos,
    checkExist,
    count,
    create,
    lastCreated,
    fetchAll,
    update,
    getRepoCountByLogin,
    getLastRepoByLogin,
    getReposSince,
    createOne
  }
}

export default Store