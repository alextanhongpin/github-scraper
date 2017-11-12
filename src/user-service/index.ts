/*
 * src/user-service/index.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 12/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import Store from './store'
import Model from './model'

import {
  UserStore,
  UserModel,
  UserService
} from './interface'

const Service = ({ config, db }: { config: any, db: any }): UserService => {
  const store: UserStore = Store({ config, db })
  const model: UserModel = Model({ store })
  return model
}

export default Service