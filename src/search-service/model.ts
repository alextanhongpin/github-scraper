/*
 * src/search-service/model.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 12/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as Bluebird from 'bluebird'
import { flatten } from '../helper/list'

import { 
  SearchRequest, 
  SearchResponse,
  SearchStore, 
  SearchModel,
  FetchCountRequest,
  FetchCountResponse,
  FetchUsersRequest,
  FetchUsersResponse
} from './interface'

// Since the model contains no validation, you can return the results directly from the store
const Model = ({ store }: { store: SearchStore }): SearchModel => {
  async function fetchCount (req: FetchCountRequest): Promise<FetchCountResponse> {
    const res = await store.search(req)
    return { totalCount: res.total_count }
  }

  async function fetchUsers (ctx: any, req: FetchUsersRequest): Promise<FetchUsersResponse> {
    const options = { concurrency: 1 }
    const users: any[] = await Bluebird.all(req.pages).map(async (page: number) => {
      const res = await ctx.retry.do(store.search, {...req.search, page })
      return res.items
    }, options)
    return { users: flatten(users) }
  }
  return {
    search: (req: SearchRequest): Promise<SearchResponse> => store.search(req),
    fetchCount,
    fetchUsers
  }
}

export default Model