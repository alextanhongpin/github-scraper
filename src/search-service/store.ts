/*
 * src/search-service/store.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 12/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as moment from 'moment'
import * as request from 'request-promise'

import buildHeader from '../helper/header'

import { 
  SearchRequest,
  SearchResponse,
  SearchStore,
} from './interface'

const Store = ({ config }: any): SearchStore => {
  async function search ({ 
    page=1,
    country='malaysia',
    startTimestamp=Date.now(),
    endTimestamp=Date.now()
  }: SearchRequest): Promise<SearchResponse> {
    const start: string = moment(startTimestamp).format('YYYY-MM-DD')
    const end: string = moment(endTimestamp).format('YYYY-MM-DD')
    console.log(`#searchService start = ${start} end = ${end} country = ${country}`)
    const options = {
      url: `https://api.github.com/search/users?q=location:${country} created:${start}..${end}&page=${page}`,
      headers: buildHeader(config.get('accessToken')),
      json: true
    }
    return request(options)
  }
  return { search }
}

export default Store