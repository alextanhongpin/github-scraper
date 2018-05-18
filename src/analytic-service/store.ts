
import { AnalyticStore, Profile, Language, LanguageDictionary, RepoDictionary, Match, Matches, UserRepos } from './interface'
import { User } from '../user-service/interface'
import { Repo } from '../repo-service/interface'
import {
  sortNumberDescending,
  take,
} from '../helper/transformer'
import stopwords from '../helper/stopwords'

const Store = ({ config, db }: { config: any, db: any }): AnalyticStore => {

  // countUsers returns the total number of users in Malaysia
  async function userCount(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      db.users.count({}, (error: Error, count: number) => {
        error ? reject(error) : resolve(count)
      })
    })
  }

  // userCountByYears returns the total number of users registered by year, and drilled down to months
  async function userCountByYears(): Promise<any> {
    return new Promise((resolve, reject) => {
      db.users.find({}, (error: Error, docs: User[]) => {
        if (error) {
          return reject(error)
        }
        const usersByYears = docs.reduce((acc: any, doc: User) => {
          const dateObject: Date = new Date(doc.created_at)
          const year: number = dateObject.getFullYear()
          const month: number = dateObject.getMonth()

          if (!acc[year]) {
            acc[year] = {
              total: 0
            }
          }
          acc[year].total += 1
          if (!acc[year][month]) {
            acc[year][month] = 0
          }
          acc[year][month] += 1
          return acc
        }, {})
        resolve(usersByYears)
      })
    })
  }

  // repoCount returns the total count of repos created by users in Malaysia (non-fork)
  async function repoCount(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      db.repos.count({
        fork: false
      }, (error: Error, count: number) => {
        error ? reject(error) : resolve(count)
      })
    })
  }

  // leaderboardLastUpdatedRepos returns the repos that are recently updated
  async function leaderboardLastUpdatedRepos(limit: number = 10): Promise<Repo[]> {
    return new Promise<Repo[]>((resolve, reject) => {
      db.repos.find({
        fork: false
      })
        .sort({
          updated_at: -1
        })
        .limit(limit)
        .exec((error: Error, docs: Repo[]) => {
          error ? reject(error) : resolve(docs)
        })
    })
  }

  // leaderboardMostStarsRepos returns the repos with the most stars
  async function leaderboardMostStarsRepos(limit: number = 10): Promise<Repo[]> {
    return new Promise<Repo[]>((resolve, reject) => {
      db.repos.find({
        fork: false
      })
        .sort({
          stargazers_count: -1
        })
        .limit(limit)
        .exec((error: Error, docs: Repo[]) => {
          error ? reject(error) : resolve(docs)
        })
    })
  }

  // leaderboardMostWatchersRepos returns the repos with the most watchers
  async function leaderboardMostWatchersRepos(limit: number = 10): Promise<Repo[]> {
    return new Promise<Repo[]>((resolve, reject) => {
      db.repos.find({
        fork: false
      })
        .sort({
          watchers_count: -1
        })
        .limit(limit)
        .exec((error: Error, docs: Repo[]) => {
          error ? reject(error) : resolve(docs)
        })
    })
  }

  // @utility
  // topLanguages is a utility function that returns the top languages based on the number of repos
  function topLanguages(docs: Repo[], limit: number = 20): Language[] {
    const languages = docs
      .filter(({ language }: Repo) => language)
      .reduce((acc: LanguageDictionary, { language }: Repo) => {
        if (!acc[language]) {
          acc[language] = {
            score: 0,
            lang: language
          }
        }
        acc[language].score += 1
        return acc
      }, {})

    const sortedLanguages: Language[] = Object.values(languages).sort(sortNumberDescending('score'))
    return take(limit)(...sortedLanguages)
  }

  // leaderboardUserWithMostRepos returns the users with the most repos
  async function leaderboardUserWithMostRepos(limit: number = 20): Promise<Repo[]> {
    return new Promise<Repo[]>((resolve, reject) => {
      db.repos.find({
        fork: false
      }, (error: Error, docs: Repo[]) => {
        if (error) {
          return reject(error)
        }

        const repoDict = docs.reduce((acc: RepoDictionary, doc: Repo) => {
          const { login, avatar_url, html_url } = doc.owner
          if (!acc[login]) {
            acc[login] = {
              count: 0,
              login,
              avatar_url,
              html_url
            }
          }
          acc[login].count += 1
          return acc
        }, {})

        const repoArr = Object.values(repoDict)
          .sort(sortNumberDescending('count'))

        return resolve(take(limit)(...repoArr))
      })
    })
  }

  // leaderboardUserWithReposByLanguage returns the top ranking users for each languages
  async function leaderboardUserWithReposByLanguage(limit: number = 20): Promise<any> {
    return new Promise((resolve, reject) => {
      db.repos.find({
        fork: false
      }, (error: Error, docs: Repo[]) => {
        if (error) {
          return reject(error)
        }
        const loginWithRepo = docs.reduce((acc: any, doc: Repo) => {
          const lang = doc.language
          const { login, avatar_url, html_url } = doc.owner
          if (!lang) return acc

          if (!acc[login]) {
            acc[login] = {
              avatar_url,
              html_url
            }
          }
          if (!acc[login][lang]) {
            acc[login][lang] = 0
          }
          acc[login][lang] += 1
          return acc
        }, {})

        const loginWithRepoScores = Object.keys(loginWithRepo).map((login) => {
          return {
            login,
            ...loginWithRepo[login]
          }
        })

        // Take the top 20
        const languages = topLanguages(docs, limit)
        const languageWithScore = languages.map(({ lang }) => {
          return {
            lang,
            top: loginWithRepoScores.filter(doc => doc[lang])
              .sort(sortNumberDescending(lang))
              .slice(0, 20).map(data => {
                const { avatar_url, html_url, login } = data
                return {
                  avatar_url,
                  html_url,
                  login,
                  count: data[lang]
                }
              })
          }
        })
        return resolve(languageWithScore)
      })
    })
  }

  // leaderboardLanguages returns the top languages based on number of repos
  async function leaderboardLanguages(limit: number = 20): Promise<Language[]> {
    return new Promise<Language[]>((resolve, reject) => {
      db.repos.find({
        fork: false
      }, (error: Error, docs: Repo[]) => {
        error ? reject(error) : resolve(topLanguages(docs, limit))
      })
    })
  }

  // getUsersRepos get the user's repos, construct a profile, save it, and then create matches
  async function getUsersRepos(limit: number = 5): Promise<UserRepos> {
    return new Promise<UserRepos>((resolve, reject) => {
      db.repos.find({
        fork: false
      }, (error: Error, docs: any) => {
        if (error) {
          return reject(error)
        }

        const userReposDict = docs.reduce((acc: any, doc: Repo) => {
          const { login, avatar_url, html_url } = doc.owner
          if (!acc[login]) {
            acc[login] = {
              repos: [],
              login,
              avatar_url,
              html_url
            }
          }
          acc[login].repos.push(doc)
          return acc
        }, {})

        return resolve(userReposDict)
      })
    })
  }

  // getAnalytics returns the analytics data based on the type provided
  async function getAnalytics(type: string): Promise<any> {
    // user_count
    return new Promise((resolve, reject) => {
      db.analytics.findOne({ type }, (error: Error, docs: any) => {
        error ? reject(error) : resolve(docs)
      })
    })
  }

  // updateAnalytics update the total count of users
  async function updateAnalytics(type: string, params: any): Promise<number> {
    // { count }
    // user_count
    // user_count_by_years
    // repo_count
    // 
    // { repos }
    // leaderboard_last_updated_repos
    // leaderboard_most_stars_repos
    // leaderboard_most_watchers_repos
    // leaderboard_most_repos
    // leaderboard_most_repos_by_language
    // 
    // { languages }
    // leaderboard_languages
    return new Promise<number>((resolve, reject) => {
      db.analytics.update({
        type
      }, {
          $set: params
        }, {
          upsert: true
        }, (error: Error, numAffected: number, _affectedDocuments: any, _upsert: boolean) => {
          error ? reject(error) : resolve(numAffected)
        })
    })
  }

  // getProfile returns the user profile based on the login
  async function getProfile(login: string): Promise<Profile> {
    return new Promise<Profile>((resolve, reject) => {
      db.profiles.findOne({
        login
      }, (error: Error, doc: Profile) => {
        error ? reject(error) : resolve(doc)
      })
    })
  }

  async function updateProfile(login: string, profile: Profile): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      db.profiles.update({
        login
      }, {
          $set: profile
        }, {
          upsert: true
        }, (error: Error, numAffected: number, _affectedDocuments: any, _upsert: boolean) => {
          error ? reject(error) : resolve(numAffected)
        })
    })
  }

  // updateProfiles update all the profiles with the latest matches
  async function updateMatches(login: string, matches: Match[]): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      db.profiles.update({
        login
      }, {
          $set: {
            matches
          }
        }, {
          upsert: true
        }, (error: Error, numAffected: number, _affectedDocuments: any, _upsert: boolean) => {
          error ? reject(error) : resolve(numAffected)
        })
    })
  }


  return {
    userCount,
    userCountByYears,
    repoCount,
    leaderboardLastUpdatedRepos,
    leaderboardMostStarsRepos,
    leaderboardMostWatchersRepos,
    leaderboardUserWithMostRepos,
    leaderboardUserWithReposByLanguage,
    leaderboardLanguages,
    getUsersRepos,
    getAnalytics,
    updateAnalytics,
    getProfile,
    updateProfile,
    updateMatches
  }
}

export default Store