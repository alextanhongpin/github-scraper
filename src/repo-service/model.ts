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
import * as moment from 'moment'

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
  CountResponse,
  GetReposRequest,
  GetReposResponse,
  GetReposAndUpdateResponse,
  GetReposAndUpdateRequest,
  GetRepoCountByLoginRequest,
  GetRepoCountByLoginResponse,
  GetLastRepoByLoginRequest,
  GetLastRepoByLoginResponse,
  GetReposSinceRequest,
  GetReposSinceResponse
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

  // Fires the Github's Search API to get the current repos by user's login, compare it with the current repo
  // that is local and updates it before returning them
  async function getReposAndUpdate (req: GetReposAndUpdateRequest): Promise<GetReposAndUpdateResponse> {
    // Fetch the latest repos from Github
    const reposStatus = await store.getRepos(req)
    const latestCount = reposStatus.total_count

    const currentRepos = await store.getRepoCountByLogin({ login: req.login })
    const currentCount = currentRepos.total_count

    // The local copy already have the same number of repositories as the Github's server 
    console.log(`#compareCount persistedCount = ${currentCount} actualCount = ${latestCount}`)
    if (currentCount === latestCount) {
      return {
        items: reposStatus.items
      }
    } 

    // Get the last current created
    const lastRepo = await store.getLastRepoByLogin({ login: req.login })

    const start: string = moment(lastRepo.created_at).format('YYYY-MM-DD')
    const end: string = moment().format('YYYY-MM-DD') // Get repos until today

    const repos = await store.getReposSince({
      login: req.login,
      page: 1,
      start,
      end
    })

    console.log(`#reposSince total_count=${repos.total_count}`)

    // Check the number of remaining pages that needs to be scraped
    const numberOfPages = Math.ceil(repos.total_count / 30)
    // Deduct one, since we already fetch one page
    const restReposPromises = await Promise.all(Array(numberOfPages - 1).fill(0).map((_, i) => i + 2).map((page: number) => {
      return store.getReposSince({
        login: req.login,
        page,
        start,
        end
      })
    }))

    const restRepos = restReposPromises
    .map((response) => response.items)
    .reduce((acc, repos) => {
      return acc.concat(repos)
    }, [])

    const allRepos = await store.create({
      repos: repos.items.concat(restRepos)
    })

    return {
      items: allRepos.repos
    }
  }

  return {
    all: (req: AllRequest): Promise<AllResponse> => store.all(req),
    allByUser: (req: AllByUserRequest): Promise<AllByUserResponse> => store.allByUser(req),
    getRepos: (req: GetReposRequest): Promise<GetReposResponse> => store.getRepos(req),
    checkExist: (req: CheckExistRequest): Promise<CheckExistResponse> => store.checkExist(req),
    count: (req: CountRequest): Promise<CountResponse> => store.count(req),
    create: (req: CreateRequest): Promise<CreateResponse> => store.create(req),
    lastCreated: (req: LastCreatedRequest): Promise<LastCreatedResponse> => store.lastCreated(req),
    fetchAll: (req: FetchAllRequest): Promise<FetchAllResponse> => store.fetchAll(req),
    update: (req: UpdateRequest): Promise<UpdateResponse> => store.update(req),
    getRepoCountByLogin: (req: GetRepoCountByLoginRequest): Promise<GetRepoCountByLoginResponse> => store.getRepoCountByLogin(req),
    getLastRepoByLogin: (req: GetLastRepoByLoginRequest): Promise<GetLastRepoByLoginResponse> => store.getLastRepoByLogin(req),
    getReposSince: (req: GetReposSinceRequest): Promise<GetReposSinceResponse> => store.getReposSince(req),
    fetchAllForUser,
    fetchAllForUsers,
    createMany,
    getReposAndUpdate
  }
}

export default Model