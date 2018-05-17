/*
 * src/user-service/store.ts
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
  FetchOneRequest,
  FetchOneResponse,
  FetchManyRequest,
  FetchManyResponse,
  UserStore,
  AllRequest,
  AllResponse,
  GetOneRequest,
  GetOneResponse,
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

const Store = ({ config, db }: { config: any, db: any }): UserStore => {
  const githubCreatedAt = config.get('githubCreatedAt')
  
  async function fetchOne ({ login }: FetchOneRequest): Promise<FetchOneResponse> {
    console.log(`#userService.fetchOne login = ${login}`)
    const options = {
      url: `https://api.github.com/users/${login}`,
      headers: buildHeader(config.get('accessToken')),
      json: true
    }
    return request(options)
  }

  async function create (req: CreateRequest): Promise<CreateResponse> {
    return new Promise<CreateRequest>((resolve, reject) => {
      db.users.insert(req.users, (error: Error, newDoc: any) => {
        console.log(`#userStore.create newDoc = ${newDoc}`)
        error ? reject(error) : resolve({ users: newDoc })
      })
    })
  }

  async function getOne (req: GetOneRequest): Promise<GetOneResponse> {
    return new Promise<GetOneResponse>((resolve, reject) => {
      db.users.find({ login: req.login }).exec((error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      })
    })
  }

  async function all ({ limit, offset }: AllRequest): Promise<AllResponse> {
    return new Promise<AllResponse>((resolve, reject) => {
      db.users.find({}).skip(offset).limit(limit).exec((error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      })
    })
  }

  async function checkExist ({ id, login }: CheckExistRequest): Promise<CheckExistResponse> {
    return new Promise<CheckExistResponse>((resolve, reject) => {
      db.users.findOne({ id, login }, (error: Error, user: any) => {
        error ? reject(error) : resolve(user)
      })
    })
  }
  async function update (req: UpdateRequest): Promise<UpdateResponse> {
    return new Promise<UpdateResponse>((resolve, reject) => {
      db.users.update({ id: req.id }, req, {}, (error: Error, numReplaced: number) => {
        error ? reject(error) : resolve({ numReplaced })
      })
    })
  }

  async function lastCreated (req: LastCreatedRequest): Promise<LastCreatedResponse> {
    return new Promise<LastCreatedResponse>((resolve, reject) => {
      db.users.findOne({}).sort({ created_at: -1 }).exec((error: Error, docs: any) => {
        error ? reject(error) : resolve({ timestamp: new Date(docs && docs.created_at || githubCreatedAt).getTime() })
      })
    })
  }

  async function count (req: CountRequest): Promise<CountResponse> {
    return new Promise<CountResponse>((resolve, reject) => {
      db.users.count({}, (error: Error, count: any) => {
        error ? reject(error) : resolve({ totalCount: count })
      })
    })
  }

  async function remove (login: string): Promise<any> {
    return new Promise((resolve, reject) => {
      db.users.remove({ login }, (error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      })
    })
  }

  return {
    fetchOne,
    getOne,
    create,
    count,
    lastCreated,
    update,
    checkExist,
    all,
    remove
  }
}

export default Store