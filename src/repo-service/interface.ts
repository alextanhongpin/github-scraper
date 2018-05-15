/*
 * src/repo-service/interface.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 12/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

export interface Repo {
  id: number;
  name: string;
  full_name: string;
  owner: RepoOwner;
  private: boolean;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url:string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  mirror_url: string;
  archived: boolean;
  open_issues_count: number;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
}

export interface RepoOwner {
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
}

// NOTE: This will cause issue such as property `concat` is missing from type Repos etc
// export interface Repos {
//   [index: number]: Repo;
// }

export interface Repos extends Array<Repo>{}

export interface GetReposRequest {
  login: string;
  page: number;
}

export interface GetReposResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repos;
}

// Any external call is prefixed with Fetch
export interface FetchAllRequest { login: string; page: number; }
export interface FetchAllResponse extends Repos {}

export interface FetchAllForUserRequest { login: string; totalCount: number; }
export interface FetchAllForUserResponse extends Repos { }

export interface FetchAllForUsersRequest { users: { login: string; totalCount: number; }[] }
export interface FetchAllForUsersResponse { repos: Repo[] }

export interface AllRequest { limit: number; offset: number;}
export interface AllResponse extends Repos {}

export interface AllByUserRequest { login: string; }
export interface AllByUserResponse extends Repos {}

export interface CheckExistRequest { id: string; login: string; }
export interface CheckExistResponse extends Repo {}

export interface CountRequest {}
export interface CountResponse { totalCount: number; }

export interface CreateRequest { repos: Repo[]; }
export interface CreateResponse { repos: Repo[]; }

export interface CreateOneRequest { repo: Repo; }
export interface CreateOneResponse { repo: Repo; }

export interface CreateManyRequest { repos: Repo[]; }
export interface CreateManyResponse { repos: Repo[]; }

export interface LastCreatedRequest {}
export interface LastCreatedResponse { timestamp: number; }

export interface UpdateRequest extends Repo {}
export interface UpdateResponse { numReplaced: number; }

export interface GetRepoCountByLoginRequest { login: string; is_forked: boolean; }
export interface GetRepoCountByLoginResponse {
  total_count: number;
}

export interface GetLastRepoByLoginRequest { login: string; }
export interface GetLastRepoByLoginResponse { created_at: string; }

export interface GetReposSinceRequest {
  login: string;
  page: number;
  start: string;
  end: string;
}
export interface GetReposSinceResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repos;
}

export interface GetReposAndUpdateRequest {
  login: string;
  page: number;
}

export interface GetReposAndUpdateResponse {
  items: Repos;
}

// The store interface
export interface RepoStore {
  all(req: AllRequest): Promise<AllResponse>;
  allByUser(req: AllByUserRequest): Promise<AllByUserResponse>;
  getRepos(req: GetReposRequest): Promise<GetReposResponse>;
  checkExist(req: CheckExistRequest): Promise<CheckExistResponse>;
  count(req: CountRequest): Promise<CountResponse>;
  create(req: CreateRequest): Promise<CreateResponse>;
  createOne(req: CreateOneRequest): Promise<CreateOneResponse>;
  lastCreated(req: LastCreatedRequest): Promise<LastCreatedResponse>;
  fetchAll(req: FetchAllRequest): Promise<FetchAllResponse>;
  update(req: UpdateRequest): Promise<UpdateResponse>;
  getRepoCountByLogin(req: GetRepoCountByLoginRequest): Promise<GetRepoCountByLoginResponse>;
  getLastRepoByLogin(req: GetLastRepoByLoginRequest): Promise<GetLastRepoByLoginResponse>;
  getReposSince(req: GetReposSinceRequest): Promise<GetReposSinceResponse>;
}

export interface RepoModel extends RepoStore {
  fetchAllForUser(req: FetchAllForUserRequest): Promise<FetchAllForUserResponse>;
  fetchAllForUsers(ctx: any, req: FetchAllForUsersRequest): Promise<FetchAllForUsersResponse>;
  createMany(req: CreateManyRequest): Promise<CreateManyResponse>;
  getRepos(req: GetReposRequest): Promise<GetReposResponse>;
  getReposAndUpdate(ctx: any, req: GetReposAndUpdateRequest): Promise<GetReposAndUpdateResponse>;
}

export interface RepoService extends RepoModel {}
