/*
 * src/search-service/interface.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 12/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

export interface SearchRequest {
  country?: string; 
  startTimestamp?: number;
  endTimestamp?: number;
  page?: number;
}

export interface SearchResponse {
  total_count: number;
  incomplete_results: boolean; 
  items?: Array<SearchItem>;
}

export interface FetchCountRequest {
  country?: string; 
  startTimestamp?: number;
  endTimestamp?: number;
  page: number;
}

export interface FetchCountResponse {
  totalCount: number;
}

export interface FetchUsersRequest {
  search: SearchRequest;
  pages: number[]
}
export interface FetchUsersResponse {
  users: SearchItem[]
}

export interface SearchItem {
  login?: string;
  id?: number;
  avatar_url?: string;
  gravatar_id?: string;
  url?: string;
  html_url?: string;
  followers_url?: string;
  following_url?: string;
  gists_url?: string;
  starred_url?: string;
  subscriptions_url?: string;
  organizations_url?: string;
  repos_url?: string;
  events_url?: string;
  received_events_url?: string;
  type?: string;
  site_admin?: boolean;
  score?: number;
}

export interface SearchStore {
  search(req: SearchRequest): Promise<SearchResponse>;
}

export interface SearchModel extends SearchStore {
  fetchCount(req: FetchCountRequest): Promise<FetchCountResponse>;
  fetchUsers(ctx:any, req: FetchUsersRequest): Promise<FetchUsersResponse>;
}

export interface SearchService extends SearchModel {}