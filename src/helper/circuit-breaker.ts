
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
    timeout: 60000, // 1 minute
    errorThresholdPercentage: 50, // When 50% of the requests are failing
    resetTimeout: 60000 // 1 minutes
  }
  const breaker: any = circuitBreaker(request, options)
  return breaker.fire(requestOptions)
}

export function CircuitBreakerWithOptions (requestOptions: Options, options: CircuitBreakerOptions): Promise<any> {
  const breaker: any = circuitBreaker(request, options)
  return breaker.fire(requestOptions)
}
