/*
 * src/food-service/model.js
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 17/10/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

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
    oneUser: (req: GetUserRequest): Promise<GetRepoResponse> => store.oneUser(req),
    oneRepo: (req: GetRepoRequest): Promise<GetRepoResponse> => store.oneRepo(req),
    search: (req: SearchRequest): Promise<SearchResponse> => store.search(req)
    // async create ({ id, name }: { id: string, name: string }) {
    //   const params = { id, name }
    //   try {
    //     const validatedParams = await schema('food', params)
    //     return store.create(validatedParams)
    //   } catch (error) {
    //     return Promise.reject(error)
    //   }
    // }
  }
}

export default (params: ModelParams) => Model(params)
