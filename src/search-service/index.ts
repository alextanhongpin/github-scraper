/*
 * src/search-service/index.ts
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
  SearchService, 
  SearchStore, 
  SearchModel
} from './interface'

// Since there are not transport layer (http), return the model directly
const Service = ({ config }: { config: any }): SearchService => {
  const store: SearchStore = Store({ config })
  const model: SearchModel = Model({ store })
  return model
}

export default Service