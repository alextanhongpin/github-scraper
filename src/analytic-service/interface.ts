import { Repo } from '../repo-service/interface'

export interface Language {
  lang: string;
  score: number;
}

export interface LanguageDictionary {
  [index: string]: Language;
}

export interface Keyword {
  word: string;
  count: number;
}

export interface RepoCounter {
  login: string;
  count: number;
  avatar_url: string;
  html_url: string;
}

export interface UserRepos {
  login: string;
  matches: Repo[];
}

export interface RepoDictionary {
  [index: string]: RepoCounter;
}

export interface Match {
  login: string;
  score: number;
}

export interface Matches {
  login: string;
  matches: Match[];
}

export interface Profile {
  totalCount: number;
  login: string;
  topLanguages: Language[];
  topKeywords: Keyword[];
  matches?: Match[];
  stargazersCount: number;
  watchersCount: number;
  forksCount: number;
  avatarUrl: string;
  htmlUrl: string;
}

export interface AnalyticStore {
  userCount(): Promise<number>;
  userCountByYears(): Promise<any>;
  repoCount(): Promise<number>;
  leaderboardLastUpdatedRepos(limit?: number): Promise<Repo[]>;
  leaderboardMostStarsRepos(limit?: number): Promise<Repo[]>;
  leaderboardMostWatchersRepos(limit?: number): Promise<Repo[]>;
  leaderboardUserWithMostRepos(limit?: number): Promise<Repo[]>;
  leaderboardUserWithReposByLanguage(limit?: number): Promise<any>;
  leaderboardLanguages(limit?: number): Promise<Language[]>;
  getUsersRepos(limit?: number): Promise<UserRepos>;
  getAnalytics(type: string): Promise<any>;
  updateAnalytics(type: string, params: any): Promise<number>;
  getProfile(login: string): Promise<Profile>;
  updateProfile(login: string, profile: Profile): Promise<number>;
  updateMatches(login: string, matches: Match[]): Promise<number>;
}

export interface AnalyticModel extends AnalyticStore {
  buildAnalytics(): Promise<any>;
  buildUserProfile(): Promise<any>;
}

export interface AnalyticService extends AnalyticModel { }