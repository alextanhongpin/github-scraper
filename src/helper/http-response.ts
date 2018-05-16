/*
 * src/helper/index.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/


import { Response } from 'express'

function BadRequest (res: Response) {
  return function (error: Error) {
    return res.status(400).json({
      error: error.message,
      code: 400
    })
  }
}

function Ok (res: Response) {
  return function (body: any) {
    return res.status(200).json(body)
  }
}

export { Ok, BadRequest }
