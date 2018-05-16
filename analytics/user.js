const db = require('./db')

// Sorts an array by the int for the given field
// E.g. arr.sort(sortIntDesc('fieldName'))
function sortIntDesc (key) {
  return (l, r) => {
    if (l[key] > r[key]) {
      return -1
    } else if (l.score === r.score) {
      return 0
    } else {
      return 1
    }
  }
}

// countUsers returns the total number of users in Malaysia
function countUsers (db) {
  db.users.count({}, (err, docs) => {
    if (err) throw err
    console.log(docs)
  })
}

// countUsersByYears returns the total number of users registered by year, and drilled down to months
function countUsersByYears (db) {
  db.users.find({}, (err, docs) => {
    if (err) throw err
    const usersByYears = docs.reduce((acc, doc) => {
      const dateObject = new Date(doc.created_at)
      const year = dateObject.getFullYear()
      const month = dateObject.getMonth()
      const yearMonth = `${year}:${month}`

      // Years only
      if (!acc.years[year]) {
        acc.years[year] = 0
      }
      acc.years[year] += 1

      if (!acc.months[yearMonth]) {
        acc.months[yearMonth] = 0
      }
      acc.months[yearMonth] += 1

      return acc
    }, {years: {}, months: {}})
    console.log(usersByYears)
  })
}

// Returns the total count of repos created by users in Malaysia (non-fork)
function countRepos (db) {
  db.repos.count({
    fork: false
  }, (err, docs) => {
    if (err) throw err
    console.log(docs)
  })
}

function top10LastUpdatedRepos (db) {
  db.repos.find({
    fork: false
  })
  .sort({
    updated_at: -1
  })
  .limit(10)
  .exec((err, docs) => {
    if (err) throw err
    console.log(docs)
  })
}

function top10MostStarsRepos (db) {
  db.repos.find({
    fork: false
  })
  .sort({
    stargazers_count: -1
  })
  .limit(10)
  .exec((err, docs) => {
    if (err) throw err
    console.log(docs)
  })
}

function top10MostWatchersRepos (db) {
  db.repos.find({
    fork: false
  })
  .sort({
    watchers_count: -1
  })
  .limit(10)
  .exec((err, docs) => {
    if (err) throw err
    console.log(docs)
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
function top20LanguageGlobal (db) {
  db.repos.find({
    fork: false
  }, (err, docs) => {
    if (err) throw err
    const languages = _top20Languages(docs)

    console.log('top 20 languages:', languages.slice(0, 20))
  })
}

// non-forked repos
function top10userWithMostRepos (db) {
  db.repos.find({
    fork: false
  }, (err, docs) => {
    if (err) throw err
    const userWithRepos = docs.reduce((acc, doc) => {
      const owner = doc.owner.login
      if (!acc[owner]) {
        acc[owner] = 0
      }
      acc[owner] += 1
      return acc
    }, {})

    const userWithReposScore = Object.keys(userWithRepos).map((login) => {
      const score = userWithRepos[login]
      return {
        login,
        score
      }
    })

    console.log(userWithReposScore.sort(sortIntDesc('score')).slice(0, 20))
  })
}

function userWithReposCountByLanguage (db) {
  db.repos.find({
    fork: false
  }, (err, docs) => {
    if (err) throw err
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
    console.log(JSON.stringify(languageWithScore, null, 2))
  })
}

// countUsers
// countUsersByYears
// countRepos
// top10LastUpdatedRepos
// top10MostStarsRepos(db)
// top10MostWatchersRepos(db)
// top20LanguageGlobal(db)
// top10userWithMostRepos(db)
// userWithReposCountByLanguage(db)
