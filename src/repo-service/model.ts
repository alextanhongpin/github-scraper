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
  Repos,
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
  GetReposSinceResponse,
  CreateOneRequest,
  CreateOneResponse
} from './interface'

const Model = ({ store, config }: { store: RepoStore, config: any }): RepoModel => {
  const githubCreatedAt = config.get('githubCreatedAt')

  async function fetchAllForUser({ totalCount, login }: FetchAllForUserRequest): Promise<FetchAllForUserResponse> {
    const pages = generatePages(totalCount, config.get('perPage'))
    const options = {
      concurrency: 20
    }
    const repos: any[] = await Bluebird.all(pages)
      .map((page: number) => store.fetchAll({ page, login }), options)

    return flatten(repos)
  }

  async function fetchAllForUsers(ctx: any, { users }: FetchAllForUsersRequest): Promise<FetchAllForUsersResponse> {
    const options = {
      concurrency: 5
    }
    const repos = await Bluebird.all(users).map((user: any) => {
      return ctx.retry.do(fetchAllForUser, user)
    }, options)
    return { repos: flatten(repos) }
  }

  async function createMany({ repos }: CreateManyRequest): Promise<CreateManyResponse> {
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
  async function getReposAndUpdate(ctx: any, req: GetReposAndUpdateRequest): Promise<GetReposAndUpdateResponse> {
    // Fetch the latest repos from Github - this only takes into consideration the user's repo, forked repos 
    // will be excluded
    const reposStatus = await store.getRepos(req)
    const latestCount = reposStatus.total_count

    const currentRepos = await store.getRepoCountByLogin({ login: req.login, is_forked: false })
    const currentCount = currentRepos.total_count

    // The local copy already have the same number of repositories as the Github's server 
    console.log(`#compareCount persistedCount = ${currentCount} actualCount = ${latestCount}`)
    if (currentCount >= latestCount) {
      return {
        items: reposStatus.items
      }
    }

    // Get the last current created
    const lastRepo = await store.getLastRepoByLogin({ login: req.login })

    const start: string = moment(lastRepo && lastRepo.created_at ? new Date(lastRepo.created_at) : githubCreatedAt).format('YYYY-MM-DD')
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
    const pages = Array(numberOfPages - 1).fill(0).map((_, i) => {
      return i + 2
    })
    const options = {
      concurrency: 5
    }
    const restReposPromises = await Bluebird.all(pages).map((page: number) => {
      const params = {
        login: req.login,
        page,
        start,
        end
      }
      return ctx.retry.do(store.getReposSince, params)
    }, options)

    const restRepos: Repo[] = restReposPromises
      .map((response) => response.items)
      .reduce((acc: Repo[], repos: Repo[]) => {
        return acc.concat(repos)
      }, [])
      .filter((nonNull: any) => nonNull !== null)

    const createReposPromises: Repo[] = await Promise.all(repos.items.concat(restRepos).map(async (repo: Repo) => {
      try {
        const data: CreateOneResponse = await store.createOne({ repo })
        return data.repo
      } catch (error) {
        return null
      }
    }))

    const createdRepos: Repos = createReposPromises.filter((nonNull: any) => nonNull !== null)

    return {
      items: createdRepos
    }
  }

  return {
    ...store,
    fetchAllForUser,
    fetchAllForUsers,
    createMany,
    getReposAndUpdate
  }
}

export default Model