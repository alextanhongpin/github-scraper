/*
 * src/github-service/route.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import config from '../config'

import { Request, Response, NextFunction } from 'express'
import { baseErrorHandler, baseSuccessHandler } from '../helper'
import { 
  GetRepoRequest, GetRepoResponse,
  GetUserRequest, GetUserResponse,
  SearchRequest, SearchResponse
} from './interface'

export default (model: any) => {
  // GET /users/:id
  // Description: Get a Github user by login id
  async function getUser (req: Request, res: Response) {
    try {
      const request: GetUserRequest = {
        login: req.params.id
      }
      const result: GetUserResponse = await model.oneUser(request)
      return baseSuccessHandler(res)(result)
    } catch (error) {
      return baseErrorHandler(res)(error)
    }
  }

  // GET /repos/:id
  // Description: Get a Github user's repo by id
  async function getRepo (req: Request, res: Response) {
    try {
      const request: GetRepoRequest = {
        login: req.params.id,
        page: req.query.page
      }
      const result: GetRepoResponse = await model.oneRepo(request)
      return baseSuccessHandler(res)(result)
    } catch (error) {
      return baseErrorHandler(res)(error)
    }
  }

  // GET /search
  // Description: Search for a Github user based on location
  async function search (req: Request, res: Response) {
    try {
      const { start, end, country, page } = req.query
      const request: SearchRequest = {
        country,
        page,
        startTimestamp: start,
        endTimestamp: end
      }
      const result: SearchResponse = await model.search(request)
      return baseSuccessHandler(res)(result)
    } catch (error) {
      return baseErrorHandler(res)(error)
    }
  }

  async function featureToggle (req: Request, res: Response, next: NextFunction) {
    if (config.get('service.food')) {
      return next()
    }
    return res.status(404).json({
      error: 'The endpoint is not implemented',
      code: 404
    })
  }

  return {
    getUser,
    getRepo,
    search,
    featureToggle
  }
}
