/*
 * src/github-service/model.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as Bluebird from 'bluebird'
import {
  GetRepoRequest, GetRepoResponse,
  GetUserRequest, GetUserResponse,
  SearchRequest, SearchResponse
} from './interface'

interface ModelParams {
  store: any;
  schema: any;
}

const Model = ({ store, schema }: ModelParams) => {
  return {
    oneUser: (req: GetUserRequest): Promise<GetUserResponse> => store.oneUser(req),
    oneRepo: (req: GetRepoRequest): Promise<GetRepoResponse> => store.oneRepo(req),
    search: (req: SearchRequest): Promise<SearchResponse> => store.search(req),
    getUsers: (req: any): Promise<any> => store.getUsers(req),
    getRepos: (req: any): Promise<any> => store.getRepos(req),
    countUser: (req: any): Promise<any> => store.countUser(req),
    countRepo: (req: any): Promise<any> => store.countRepo(req),
    lastUpdatedRepo: (req: any): Promise<any> => store.lastUpdatedRepo(req),
    lastUpdatedUser: (req: any): Promise<any> => store.lastUpdatedUser(req),
    insertBulkUsers: async(users: any): Promise<any> => {
      // For each users...
      const validatedUsers = await Bluebird.all(users).map(async (user: any) => {
        // Check if the user exist
        const existingUser = await store.checkUserExist({ 
          id: user.id
        })
        // Update existing user
        if (existingUser) {
          const isUpdatedUser = existingUser.updated_at < user.updated_at
          if (isUpdatedUser) {
            await store.updateUser(user)
          }
          return null
        }
        // And return the new users
        return user
      }, {
        concurrency: 50
      })
      const newUsers = validatedUsers.filter((nonNull: any) => nonNull) // Take only new users
      if (!newUsers.length) {
        return []
      }
      // Save new users
      const newDocs = await store.saveUsers(newUsers)
      return newDocs
    },
    insertBulkRepos: async(repos: any): Promise<any> => {
      // For each repos...
      const validatedRepos = await Bluebird.all(repos).map(async (repo: any) => {
        // Check if the repo exist
        const existingRepo = await store.checkRepoExist({ 
          id: repo.id
        })
        // Update existing repo
        if (existingRepo) {
          const isUpdatedRepo = existingRepo.updated_at < repo.updated_at
          if (isUpdatedRepo) {
            await store.updateRepo(repo)
          }
          return null
        }
        // And return the new repos
        return repo
      }, {
        concurrency: 50
      })
      const newRepos = validatedRepos.filter((nonNull: any) => nonNull) // Take only new users
      if (!newRepos.length) {
        return []
      }
      // Save new repos
      const newDocs = await store.saveRepos(newRepos)
      return newDocs
    }
  }
}

export default (params: ModelParams) => Model(params)
