/*
 * src/user-service/repo.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 12/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

import * as Bluebird from 'bluebird'
import { 
  User,
  UserModel,
  UserStore,
  CreateManyRequest,
  CreateManyResponse,
  FetchOneRequest,
  FetchOneResponse,
  FetchManyRequest,
  FetchManyResponse,
  AllRequest,
  AllResponse,
  CreateRequest, 
  CreateResponse,
  CheckExistRequest,
  CheckExistResponse,
  UpdateRequest,
  UpdateResponse,
  LastCreatedRequest,
  LastCreatedResponse,
  CountRequest,
  CountResponse,
  GetOneRequest,
  GetOneResponse,
} from './interface'

const Model = ({ store }: { store: UserStore }): UserModel => {

  async function fetchMany (ctx: any, { logins }: FetchManyRequest): Promise<FetchManyResponse> {
    const options = { concurrency: 3 }
    const users = await Bluebird.all(logins)
      .map((login: string) => ctx.retry.do(store.fetchOne, { login }) , options)
      
    return { users }
  }

  async function createMany ({ users }: CreateManyRequest): Promise<CreateManyResponse> {
    const validatedUsers = await Bluebird.all(users).map(async (user: User) => {
      // Check if the user exist
      const existingUser = await store.checkExist({ 
        id: user.id,
        login: user.login
      })
      console.log(`#checkUserExist with id = ${user.id} and login = ${user.login} output = ${existingUser}`)
      // Update existing user
      if (existingUser) {
        console.log(`#userExist with id = ${user.id} and login = ${user.login}`)
        // const isUpdatedUser = existingUser.updated_at < user.updated_at
        // if (isUpdatedUser) {
          // Override the createdAt date that is assigned by the storage
        user.createdAt = new Date().toUTCString()
        await store.update(user)
        // }
        return null
      }

      console.log(`#userService.createMany login = ${user.login} id = ${user.id}`)
      // And return the new users
      return user
    }, {
      concurrency: 50
    })
    const newUsers = validatedUsers.filter((nonNull: any) => nonNull !== null) // Take only new users
    console.log(`#newUsers = ${newUsers.length}`)
    if (!newUsers.length) {
      return { users: [] }
    }
    // Save new users
    return store.create({ users: newUsers })
  }

  return {
    all: (req: AllRequest): Promise<AllResponse> => store.all(req),
    checkExist: (req: CheckExistRequest): Promise<CheckExistResponse> => store.checkExist(req),
    count: (req: CountRequest): Promise<CountResponse> => store.count(req),
    create: (req: CreateRequest): Promise<CreateResponse> => store.create(req),
    lastCreated: (req: LastCreatedRequest): Promise<LastCreatedResponse> => store.lastCreated(req),
    fetchOne: (req: FetchOneRequest): Promise<FetchOneResponse> => store.fetchOne(req),
    getOne: (req: GetOneRequest): Promise<GetOneResponse> => store.getOne(req),
    update: (req: UpdateRequest): Promise<UpdateResponse> => store.update(req),
    fetchMany,
    createMany
  }
}

export default Model