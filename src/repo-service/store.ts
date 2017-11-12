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
  CreateRequest, 
  CreateResponse,
  CheckExistRequest,
  CheckExistResponse,
  UpdateRequest,
  UpdateResponse,
  LastCreatedRequest,
  LastCreatedResponse,
  CountRequest,
  CountResponse
} from './interface'

const Store = ({ config, db }: { config: any, db: any }): RepoStore => {

  const githubCreatedAt = new Date(2008, 3, 1) // April 2008

  async function fetchAll ({ login, page=1 }: FetchAllRequest): Promise<FetchAllResponse> {
    const options = {
      url: `https://api.github.com/users/${login}/repos?page=${page}`,
      headers: buildHeader(config.get('accessToken')),
      json: true
    }
    return request(options)
  }

  async function all (req: AllRequest): Promise<AllResponse> {
    return new Promise<AllResponse>((resolve, reject) => {
      db.repos.find({}, (error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      })
    })
  }

  async function create (req: CreateRequest): Promise<CreateResponse> {
    return new Promise<CreateResponse>((resolve, reject) => {
      db.repos.insert(req, (error: Error, newDoc: any) => {
        error ? reject(error) : resolve(newDoc)
      })
    })
  }

  async function checkExist (req: CheckExistRequest): Promise<CheckExistResponse> {
    return new Promise<CheckExistResponse>((resolve, reject) => {
      db.repos.findOne(req, (error: Error, repo: any) => {
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

  async function count (req: CountRequest): Promise<CountResponse> {
    return new Promise<CountResponse>((resolve, reject) => {
      db.repos.count({}, (error: Error, count: any) => {
        error ? reject(error) : resolve({ totalCount: count })
      })
    })
  }

  return {
    all,
    checkExist,
    count,
    create,
    lastCreated,
    fetchAll,
    update
  }
}

export default Store