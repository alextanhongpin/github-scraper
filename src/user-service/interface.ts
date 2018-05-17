/*
 * src/user-service/interface.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 12/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/


export interface User {
  login: string; 
  id: number;
  avatar_url: string; 
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string; 
  following_url: string; 
  gists_url: string; 
  starred_url: string;
  subscriptions_url: string; 
  organizations_url: string; 
  repos_url: string; 
  events_url: string;
  received_events_url: string; 
  type: string;
  site_admin: boolean; 
  name: string; 
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: boolean;
  bio: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string; // Refers to the date the user update the Github profile
  fetched_at: string; // Refers to the date the user data is fetched from the scraper
}

// export interface Users {
//   [index: number]: User;
// }

export interface Users extends Array<User>{};

export interface FetchOneRequest { login: string; }
export interface FetchOneResponse extends User {}

export interface FetchManyRequest { logins: string[]; }
export interface FetchManyResponse { users: User[] }

export interface AllRequest {
  limit: number;
  offset: number;
}
export interface AllResponse extends Users {}

export interface GetOneRequest { login: string; }
export interface GetOneResponse extends User {}

export interface CheckExistRequest { id: number; login: string; }
export interface CheckExistResponse extends User {}

export interface CountRequest {}
export interface CountResponse { totalCount: number; }

export interface CreateRequest { users: User[]; }
export interface CreateResponse { users: User[]; }

export interface CreateManyRequest { users: User[]; }
export interface CreateManyResponse { users: User[]; }

export interface LastCreatedRequest {}
export interface LastCreatedResponse { timestamp: number; }

export interface UpdateRequest extends User {}
export interface UpdateResponse { numReplaced: number; }

export interface UserStore {
  all(req: AllRequest): Promise<AllResponse>;
  checkExist(req: CheckExistRequest): Promise<CheckExistResponse>;
  getOne(req: GetOneRequest): Promise<GetOneResponse>;
  count(req: CountRequest): Promise<CountResponse>;
  create(req: CreateRequest): Promise<CreateResponse>;
  lastCreated(req: LastCreatedRequest): Promise<LastCreatedResponse>;
  fetchOne(req: FetchOneRequest): Promise<FetchOneResponse>;
  update(req: UpdateRequest): Promise<UpdateResponse>;
  remove(login: string): Promise<any>;
}

export interface UserModel extends UserStore {
  getOne(req: GetOneRequest): Promise<GetOneResponse>;
  fetchMany(ctx: any, req: FetchManyRequest): Promise<FetchManyResponse>;
  createMany(req: CreateManyRequest): Promise<CreateManyResponse>;
}

export interface UserService extends UserModel {}