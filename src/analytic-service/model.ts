import {
  take,
  sum,
  pick,
  getCount,
  objectToArray,
  arrayToObject,
  sortNumberDescending
} from '../helper/transformer'
import stopwords from '../helper/stopwords'

import { Repo } from '../repo-service/interface';
import { Profile, Language, Keyword, AnalyticModel, AnalyticStore, Matches } from './interface'

// Returns the top languages for the particular user
const getTopLanguages = (repos: Repo[], limit: number = 10): Language[] => {
  const reposWithLanguage = repos.filter(({ language }: { language: string }) => language)
  const languageDict = getCount('language')(reposWithLanguage)
  const totalCount = sum(...Object.values(languageDict))
  const scores = objectToArray(languageDict)
    .map(({ key, value }) => ({
      lang: key,
      score: Math.round(value / totalCount * 100),
      count: value
    }))
    .sort(sortNumberDescending('score'))
  return take(limit)(...scores)
}

const getBagOfWords = (repos: Repo[]) => {
  return repos
    .map(({ description }: { description: string }) => description || '')
    .map((description: string) => description.toLowerCase())
    .map((description: string) => description.split(' '))
    .reduce((a: string[], b: string[]) => a.concat(b), [])
}

// Utilities to get the top keywords
const getTopKeywords = (repos: Repo[], limit: number = 10): Keyword[] => {
  const bagOfWords = arrayToObject(getBagOfWords(repos))
  const sortedKeywordsWithScore = objectToArray(bagOfWords)
    .filter(({ key, value }) => !stopwords.includes(key))
    .sort(sortNumberDescending('value'))
    .map(({ key, value }) => ({ word: key, count: value }))

  return take(limit)(...sortedKeywordsWithScore)
}

const createProfile = (login: string, repos: Repo[], avatarUrl: string, htmlUrl: string, limit: number = 10): Profile => {
  const topLanguages = getTopLanguages(repos, limit)
  const topKeywords = getTopKeywords(repos, limit)
  const stargazersCount = sum(...pick('stargazers_count')(...repos))
  const watchersCount = sum(...pick('watchers_count')(...repos))
  const forksCount = sum(...pick('forks_count')(...repos))

  return {
    totalCount: repos.length,
    login,
    topLanguages,
    topKeywords,
    stargazersCount,
    watchersCount,
    forksCount,
    avatarUrl,
    htmlUrl
  }
}

const constructFeatures = ({
  totalCount,
  login,
  topLanguages,
  topKeywords,
  stargazersCount,
  watchersCount,
  forksCount
}: Profile): any => {
  const languages = topLanguages.reduce((acc: any, doc: Language) => {
    acc[`lang__${doc.lang}`] = doc.score
    return acc
  }, {})

  const keywords = topKeywords.reduce((acc: any, doc: Keyword) => {
    acc[`word__${doc.word}`] = doc.count
    return acc
  }, {})

  return {
    ...languages,
    ...keywords,
    totalCount,
    login,
    stargazersCount,
    watchersCount,
    forksCount
  }
}

const similarityProfile = (profile1: any, profile2: any): number => {
  const uniqueKeys = new Set(Object.keys(profile1).concat(Object.keys(profile2)))
  const score = [...uniqueKeys].map((key: string) => {
    const value1 = profile1[key]
    const value2 = profile2[key]
    if (value1 && value2) {
      if (typeof value1 === 'string' || typeof value2 === 'string') {
        return 0
      }
      return Math.pow(value1 - value2, 2)
    }
    return 0
  }).reduce((a, b) => a + b, 0)
  return 1 / (1 + Math.sqrt(score))
}


const Model = ({ store }: { store: AnalyticStore }): AnalyticModel => {

  async function buildAnalytics(): Promise<any> {
    console.log('#analytic-service fn=buildAnalytics event=start')
    const [userCount, userCountByYears, repoCount, leaderboardLastUpdatedRepos, leaderboardMostStarsRepos, leaderboardMostWatchersRepos, leaderboardUserWithMostRepos, leaderboardUserWithReposByLanguage, leaderboardLanguages] = await Promise.all([
      store.userCount(),
      store.userCountByYears(),
      store.repoCount(),
      store.leaderboardLastUpdatedRepos(),
      store.leaderboardMostStarsRepos(),
      store.leaderboardMostWatchersRepos(),
      store.leaderboardUserWithMostRepos(),
      store.leaderboardUserWithReposByLanguage(),
      store.leaderboardLanguages()
    ])

    const response = await Promise.all([
      store.updateAnalytics('user_count', { count: userCount }),
      store.updateAnalytics('user_count_by_years', { count: userCountByYears }),
      store.updateAnalytics('repo_count', { count: repoCount }),
      store.updateAnalytics('leaderboard_last_updated_repos', { repos: leaderboardLastUpdatedRepos }),
      store.updateAnalytics('leaderboard_most_stars_repos', { repos: leaderboardMostStarsRepos }),
      store.updateAnalytics('leaderboard_most_watchers_repos', { repos: leaderboardMostWatchersRepos }),
      store.updateAnalytics('leaderboard_most_repos', { repos: leaderboardUserWithMostRepos }),
      store.updateAnalytics('leaderboard_most_repos_by_language', { repos: leaderboardUserWithReposByLanguage }),
      store.updateAnalytics('leaderboard_languages', { languages: leaderboardLanguages }),
    ])
    console.log('#analytic-service fn=buildAnalytics event=completed')
    return response
  }

  async function buildUserProfile(): Promise<any> {
    console.time('#analytic-service fn=buildUserProfile')
    console.log('#analytic-service fn=buildUserProfile event=start')
    const repos = await store.getUsersRepos()
    const profiles: Profile[] = Object.values(repos)
      .map(({ login, repos, avatar_url, html_url }: { login: string, repos: Repo[], avatar_url: string, html_url: string }) => {
        const profile = createProfile(login, repos, avatar_url, html_url)
        return profile
      })

    const updatePromises = profiles.map((profile: Profile) => {
      return store.updateProfile(profile.login, profile)
    })

    // Save all the user data before making the matches
    await Promise.all(updatePromises)

    const matches = profiles.map((profile1: Profile, i: number) => {
      const features1 = constructFeatures(profile1)
      const matches = profiles.map((profile2: Profile, j: number) => {
        if (i < j) {
          const features2 = constructFeatures(profile2)
          return {
            login: profile2.login,
            avatarUrl: profile2.avatarUrl,
            htmlUrl: profile2.htmlUrl,
            score: similarityProfile(features1, features2),
          }
        }
        return {
          score: -Infinity
        }
      })
        .filter(({ score }: { score: number }) => score >= 0)
        .sort(sortNumberDescending('score'))

      return {
        login: profile1.login,
        avatarUrl: profile1.avatarUrl,
        htmlUrl: profile1.htmlUrl,
        matches: take(20)(...matches.reverse()) // The shorter the
      }
    })
      .filter(({ matches }: Matches) => matches.length)

    const promises = matches.map(({ login, matches }) => {
      return store.updateMatches(login, matches)
    })

    const data = await Promise.all(promises)
    console.log('#analytic-service fn=buildUserProfile event=completed')
    console.timeEnd('#analytic-service fn=buildUserProfile')
    return data
  }

  return {
    ...store,
    buildAnalytics,
    buildUserProfile
  }
}

export default Model