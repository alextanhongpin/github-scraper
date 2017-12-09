/*
 * src/repo-service/model.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 12/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as Bluebird from 'bluebird'

import { generatePages } from '../helper/page'
import { flatten } from '../helper/list'

import { 
  RepoModel,
  Repo,
  RepoStore,
  CreateManyRequest,
  CreateManyResponse,
  FetchAllRequest,
  FetchAllResponse,
  FetchAllForUserRequest,
  FetchAllForUserResponse,
  FetchAllForUsersRequest,
  FetchAllForUsersResponse,
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
  CountResponse
} from './interface'

const Model = ({ store, config }: { store: RepoStore, config: any }): RepoModel => {
  async function fetchAllForUser ({ totalCount, login }: FetchAllForUserRequest): Promise<FetchAllForUserResponse> {
    const pages = generatePages(totalCount, config.get('perPage'))
    const options = { 
      concurrency: 20 
    }
    const repos: any[] = await Bluebird.all(pages)
      .map((page: number) => store.fetchAll({ page, login }), options)

    return flatten(repos)
  }

  async function fetchAllForUsers (ctx: any, { users }: FetchAllForUsersRequest): Promise<FetchAllForUsersResponse> {
    const options = {
      concurrency: 5
    }
    const repos = await Bluebird.all(users).map((user: any) => {
      return ctx.retry.do(fetchAllForUser, user)
    }, options)
    return { repos: flatten(repos) }
  }

  async function createMany ({ repos }: CreateManyRequest): Promise<CreateManyResponse> {
      // For each repos...
    const validatedRepos = await Bluebird.all(repos).map(async (repo: any) => {
      // Check if the repo exist
      const existingRepo = await store.checkExist({ 
        id: repo.id,
        login: repo.owner && repo.owner.login
      })
      
      // Update existing repo
      if (existingRepo) {
        console.log(`#repoExist with id = ${repo.id} login = ${existingRepo.owner && existingRepo.owner.login} `)
        const isUpdatedRepo = existingRepo.updated_at < repo.updated_at
        if (isUpdatedRepo) {
          await store.update(repo)
        }
        return null
      }
      console.log(`#repoService.createMany name = ${repo.name} id = ${repo.id} owner = ${repo.owner && repo.owner.login}`)
      // And return the new repos
      return repo
    }, {
      concurrency: 50
    })
    const newRepos = validatedRepos.filter((nonNull: any) => nonNull !== null) // Take only new users
    console.log(`#newRepos = ${newRepos.length}`)
    if (!newRepos.length) {
      return { repos: [] }
    }
    // Save new repos
    return store.create({ repos: newRepos })
  }

  return {
    all: (req: AllRequest): Promise<AllResponse> => store.all(req),
    allByUser: (req: AllByUserRequest): Promise<AllByUserResponse> => store.allByUser(req),
    checkExist: (req: CheckExistRequest): Promise<CheckExistResponse> => store.checkExist(req),
    count: (req: CountRequest): Promise<CountResponse> => store.count(req),
    create: (req: CreateRequest): Promise<CreateResponse> => store.create(req),
    lastCreated: (req: LastCreatedRequest): Promise<LastCreatedResponse> => store.lastCreated(req),
    fetchAll: (req: FetchAllRequest): Promise<FetchAllResponse> => store.fetchAll(req),
    update: (req: UpdateRequest): Promise<UpdateResponse> => store.update(req),
    fetchAllForUser,
    fetchAllForUsers,
    createMany
  }
}

export default Model