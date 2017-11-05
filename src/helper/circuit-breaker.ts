/*
 * src/helper/circuit-breaker.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as circuitBreaker from 'opossum'
import * as request from 'request-promise'
import { RequestAPI, RequiredUriUrl } from 'request'
import { Options, RequestPromise, RequestPromiseOptions } from 'request-promise'

export interface CircuitBreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
}

export function DefaultCircuitBreaker(requestOptions: Options): Promise<any> {
  const options: CircuitBreakerOptions = {
    timeout: 300000, // 5 minutes
    errorThresholdPercentage: 50, // When 50% of the requests are failing
    resetTimeout: 300000 // 5 minutes
  }
  const breaker: any = circuitBreaker(request, options)
  return breaker.fire(requestOptions)
}

export function CircuitBreakerWithOptions (requestOptions: Options, options: CircuitBreakerOptions): Promise<any> {
  const breaker: any = circuitBreaker(request, options)
  return breaker.fire(requestOptions)
}
