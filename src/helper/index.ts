/*
 * src/helper/index.js
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 17/10/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import { Response } from 'express'

function baseErrorHandler (res: Response) {
  return function (error: Error) {
    return res.status(400).json({
      error: error.message,
      code: error.code
    })
  }
}

function baseSuccessHandler (res: Response) {
  return function (body: any) {
    return res.status(200).json({
      data: body
    })
  }
}

export { baseErrorHandler, baseSuccessHandler }
