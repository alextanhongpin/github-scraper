const stopwords = require('./stopwords')

// Get the total count of documents based on the key given
const getCount = (key) => (docs) => docs.reduce((acc, doc) => {
  const value = doc[key]
  if (!acc[value]) {
    acc[value] = 0
  }
  acc[value] += 1
  return acc
}, {})

// Get the total sum of all the arguments
const sum = (...args) => args.reduce((l, r) => l + r, 0)

// Take a given number of item from an array
const take = (limit) => (...args) => args.slice(0, limit)

// Take only a specific key
const pick = (key) => (...args) => args.map(arg => arg[key])

// Take an object and flatten it into array
const objectToArray = (obj) => Object.keys(obj).map((key) => ({
  key,
  value: obj[key]
}))

// Takes a flattened list (1-dimensional) and convert it into and object
const arrayToObject = (arr) => arr.reduce((acc, item) => {
  if (!acc[item]) {
    acc[item] = 0
  }
  acc[item] += 1
  return acc
}, {})

const sortNumbers = (left, right) => {
  if (left > right) {
    return -1
  }
  if (left === right) {
    return 0
  }
  return 1
}

// Sort numbers in descending based on the key
const sortNumberDescending = (key) => (a, b) => sortNumbers(a[key], b[key])

// Returns the top languages for the particular user
const getTopLanguages = (repos, limit = 10) => {
  const reposWithLanguage = repos.filter(({ language }) => language)
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

const getBagOfWords = (repos) => {
  return repos
    .map(({ description }) => description || '')
    .map((description) => description.toLowerCase())
    .map((description) => description.split(' '))
    .reduce((a, b) => a.concat(b), [])
}

// Utilities to get the top keywords
const getTopKeywords = (repos, limit = 10) => {
  const bagOfWords = arrayToObject(getBagOfWords(repos))
  const sortedKeywordsWithScore = objectToArray(bagOfWords)
    .filter(({ key, value }) => !stopwords.includes(key))
    .sort(sortNumberDescending('value'))
    .map(({ key, value }) => ({ word: key, count: value }))

  return take(limit)(...sortedKeywordsWithScore)
}

function createProfile (login, repos, limit = 10) {
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
    forksCount
  }
}

const flattenProfile = ({
  totalCount,
  login,
  topLanguages,
  topKeywords,
  stargazersCount,
  watchersCount,
  forksCount
}) => {
  const flattendLanguages = topLanguages.reduce((acc, doc) => {
    acc[`lang__${doc.lang}`] = doc.count
    return acc
  }, {})
  const flattenedKeywords = topKeywords.reduce((acc, doc) => {
    acc[`word__${doc.word}`] = doc.count
    return acc
  }, {})
  return {
    ...flattendLanguages,
    ...flattenedKeywords,
    totalCount,
    login,
    stargazersCount,
    watchersCount,
    forksCount
  }
}

const similarityProfile = (profile1, profile2) => {
  const uniqueKeys = new Set(Object.keys(profile1).concat(Object.keys(profile2)))
  const score = [...uniqueKeys].map((key) => {
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
  if (score === 0) return 0
  return 1 / (1 + Math.sqrt(score))
}

module.exports = {
  createProfile,
  flattenProfile,
  similarityProfile
}
