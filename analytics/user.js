const db = require('./db')
const {
  createProfile,
  flattenProfile,
  similarityProfile
} = require('./stats')

// Sorts an array by the int for the given field
// E.g. arr.sort(sortIntDesc('fieldName'))
function sortIntDesc (key) {
  return (l, r) => {
    const a = l[key]
    const b = r[key]
    if (a > b) {
      return -1
    }
    if (a === b) {
      return 0
    }
    return 1
  }
}

// countUsers returns the total number of users in Malaysia
function countUsers (db) {
  return new Promise((resolve, reject) => {
    db.users.count({}, (error, count) => {
      error ? reject(error) : resolve(count)
    })
  })
}

// countUsersByYears returns the total number of users registered by year, and drilled down to months
function countUsersByYears (db) {
  return new Promise((resolve, reject) => {
    db.users.find({}, (error, docs) => {
      if (error) {
        return reject(error)
      }
      const usersByYears = docs.reduce((acc, doc) => {
        const dateObject = new Date(doc.created_at)
        const year = dateObject.getFullYear()
        const month = dateObject.getMonth()

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

// Returns the total count of repos created by users in Malaysia (non-fork)
function countRepos (db) {
  return new Promise((resolve, reject) => {
    db.repos.count({
      fork: false
    }, (error, count) => {
      error ? reject(error) : resolve(count)
    })
  })
}

function top10LastUpdatedRepos (db, limit = 10) {
  return new Promise((resolve, reject) => {
    db.repos.find({
      fork: false
    })
    .sort({
      updated_at: -1
    })
    .limit(limit)
    .exec((error, docs) => {
      error ? reject(error) : resolve(docs)
    })
  })
}

function top10MostStarsRepos (db, limit = 10) {
  return new Promise((resolve, reject) => {
    db.repos.find({
      fork: false
    })
    .sort({
      stargazers_count: -1
    })
    .limit(limit)
    .exec((error, docs) => {
      error ? reject(error) : resolve(docs)
    })
  })
}

function top10MostWatchersRepos (db, limit = 10) {
  return new Promise((resolve, reject) => {
    db.repos.find({
      fork: false
    })
    .sort({
      watchers_count: -1
    })
    .limit(limit)
    .exec((error, docs) => {
      error ? reject(error) : resolve(docs)
    })
  })
}

function _top20Languages (docs) {
  const languages = docs.reduce((acc, {language}) => {
    if (!acc[language]) {
      acc[language] = 0
    }
    acc[language] += 1
    return acc
  }, {})

  const arrayOfLangAndScores = Object.keys(languages).map((lang) => {
    const score = languages[lang]
    return {
      score,
      lang
    }
  })
  const sortedInDescendingOrder = arrayOfLangAndScores.sort(sortIntDesc('score'))

  // Filter `null`, since it is not a language
  const filtered = sortedInDescendingOrder.filter(({ lang }) => lang !== 'null')
  return filtered
}

function top20LanguageGlobal (db, limit = 20) {
  return new Promise((resolve, reject) => {
    db.repos.find({
      fork: false
    }, (error, docs) => {
      error ? reject(error) : resolve(_top20Languages(docs).slice(0, limit))
    })
  })
}

function top10userWithMostRepos (db) {
  return new Promise((resolve, reject) => {
    db.repos.find({
      fork: false
    }, (error, docs) => {
      if (error) {
        return reject(error)
      }

      const repoDict = docs.reduce((acc, doc) => {
        const login = doc.owner.login
        if (!acc[login]) {
          acc[login] = {
            count: 0,
            login
          }
        }
        acc[login].count += 1
        return acc
      }, {})

      const repoArr = Object.values(repoDict)
        .sort(sortIntDesc('count'))
        .slice(0, 20)

      return resolve(repoArr)
    })
  })
}

function userWithReposCountByLanguage (db) {
  return new Promise((resolve, reject) => {
    db.repos.find({
      fork: false
    }, (error, docs) => {
      if (error) {
        return reject(error)
      }
      const loginWithRepo = docs.reduce((acc, doc) => {
        const lang = doc.language
        const login = doc.owner.login
        if (!lang) return acc

        if (!acc[login]) {
          acc[login] = {}
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
      const languages = _top20Languages(docs).slice(0, 20)
      const languageWithScore = languages.map(({ lang }) => {
        return {
          lang,
          top: loginWithRepoScores.filter(doc => doc[lang]).sort(sortIntDesc(lang)).slice(0, 20)
        }
      })
      return resolve(languageWithScore)
    })
  })
}

function getUsersRepos (db, limit = 5) {
  return new Promise((resolve, reject) => {
    db.repos.find({
      fork: false
    }, (error, docs) => {
      if (error) {
        return reject(error)
      }

      const userReposDict = docs.reduce((acc, doc) => {
        const login = doc.owner.login
        if (!acc[login]) {
          acc[login] = {
            repos: [],
            login
          }
        }
        acc[login].repos.push(doc)
        return acc
      }, {})

      const profiles = Object.values(userReposDict).map(({ login, repos }) => {
        const profile = createProfile(login, repos)
        return profile
      })

      const promises = profiles.map((profile) => {
        return new Promise((resolve, reject) => {
          db.profiles.update({
            login: profile.login
          }, {
            $set: profile
          }, {
            upsert: true
          }, (error, numAffected, affectedDocuments, upsert) => {
            error ? reject(error) : resolve(numAffected, affectedDocuments, upsert)
          })
        })
      })
      Promise.all(promises).then(console.log).catch(console.log)

      const matches = profiles.map((profile1, i) => {
        const features1 = flattenProfile(profile1)
        return {
          login: profile1.login,
          matches: profiles.map((profile2, j) => {
            if (i < j) {
              const features2 = flattenProfile(profile2)
            // Cannot match yourself
              return {
                login: profile2.login,
                score: similarityProfile(features1, features2)
              }
            } else {
              return {
                score: -Infinity
              }
            }
          })
        .filter(({ score }) => score >= 0)
        .sort(sortIntDesc('score'))
        .slice(0, limit)
        }
      }).filter(({ matches }) => matches.length)
      resolve(matches)
    })
  })
}

async function main () {
  // const userCounts = await countUsers(db)
  // console.log('userCounts:', userCounts)

  // db.analytics.update({
  //   type: 'user_count'
  // }, {
  //   $set: {
  //     count: userCounts
  //   }
  // }, {
  //   upsert: true
  // }, (error, numAffected, affectedDocuments, upsert) => {
  //   console.log(error, numAffected, affectedDocuments, upsert)
  // })

  // const userCountsByYears = await countUsersByYears(db)
  // console.log('userCountsByYears:', userCountsByYears)
  // db.analytics.update({
  //   type: 'user_count_by_years'
  // }, {
  //   $set: {
  //     count: userCountsByYears
  //   }
  // }, {
  //   upsert: true
  // }, (error, numAffected, affectedDocuments, upsert) => {
  //   console.log(error, numAffected, affectedDocuments, upsert)
  // })

  // const repoCount = await countRepos(db)
  // db.analytics.update({
  //   type: 'repo_count'
  // }, {
  //   $set: {
  //     count: repoCount
  //   }
  // }, {
  //   upsert: true
  // }, (error, numAffected, affectedDocuments, upsert) => {
  //   console.log(error, numAffected, affectedDocuments, upsert)
  // })

  // const repos = await top10LastUpdatedRepos(db)
  // db.analytics.update({
  //   type: 'leaderboard_last_updated_repos'
  // }, {
  //   $set: {
  //     repos: repos
  //   }
  // }, {
  //   upsert: true
  // }, (error, numAffected, affectedDocuments, upsert) => {
  //   console.log(error, numAffected, affectedDocuments, upsert)
  // })

  // const repos = await top10MostStarsRepos(db)
  // db.analytics.update({
  //   type: 'leaderboard_most_stars_repos'
  // }, {
  //   $set: {
  //     repos: repos
  //   }
  // }, {
  //   upsert: true
  // }, (error, numAffected, affectedDocuments, upsert) => {
  //   console.log(error, numAffected, affectedDocuments, upsert)
  // })

  // const watchers = await top10MostWatchersRepos(db)
  // db.analytics.update({
  //   type: 'leaderboard_most_watchers_repos'
  // }, {
  //   $set: {
  //     repos: watchers
  //   }
  // }, {
  //   upsert: true
  // }, (error, numAffected, affectedDocuments, upsert) => {
  //   console.log(error, numAffected, affectedDocuments, upsert)
  // })
  // const languages = await top20LanguageGlobal(db)
  // console.log(languages)
  // db.analytics.update({
  //   type: 'leaderboard_languages'
  // }, {
  //   $set: {
  //     languages: languages
  //   }
  // }, {
  //   upsert: true
  // }, (error, numAffected, affectedDocuments, upsert) => {
  //   console.log(error, numAffected, affectedDocuments, upsert)
  // })

  // const repos = await top10userWithMostRepos(db)
  // db.analytics.update({
  //   type: 'leaderboard_most_repos'
  // }, {
  //   $set: {
  //     repos
  //   }
  // }, {
  //   upsert: true
  // }, (error, numAffected, affectedDocuments, upsert) => {
  //   console.log(error, numAffected, affectedDocuments, upsert)
  // })

  // const repos = await userWithReposCountByLanguage(db)
  // db.analytics.update({
  //   type: 'leaderboard_most_repos_by_language'
  // }, {
  //   $set: {
  //     repos
  //   }
  // }, {
  //   upsert: true
  // }, (error, numAffected, affectedDocuments, upsert) => {
  //   console.log(error, numAffected, affectedDocuments, upsert)
  // })
  // const matches = await getUsersRepos(db, 10)

  // const promises = matches.map(({ login, matches }) => {
  //   return new Promise((resolve, reject) => {
  //     db.profiles.update({
  //       login
  //     }, {
  //       $set: {
  //         matches
  //       }
  //     }, {
  //       upsert: true
  //     }, (error, numAffected, affectedDocuments, upsert) => {
  //       // console.log(error, numAffected, affectedDocuments, upsert)
  //       error ? reject(error) : resolve(numAffected)
  //     })
  //   })
  // })
  // const data = await Promise.all(promises)
  // console.log('done', data)
  // const myMatches = matches.filter(({ login }) => login === 'alextanhongpin' || login === 'roylee0704')
  // console.log(JSON.stringify(myMatches, null, 2))

  db.profiles.find({ login: 'alextanhongpin' }, (_, docs) => {
    console.log(JSON.stringify(docs, null, 2))
  })
}
main()
