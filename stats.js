const user = require('./data/alextanhongpin.json')
console.log(`user:\n  alextanhongpin`)
console.log('total repos:', user.data.length)

const cache = user.data.reduce((acc, repo) => {
  if (!acc[repo.language]) {
    acc[repo.language] = 0
  }
  acc[repo.language] += 1
  return acc
}, {})

const totalCount = Object.values(cache).reduce((l, r) => l + r, 0)

const scores = Object.keys(cache).map((lang) => {
  return {
    lang,
    score: Math.round(cache[lang] / totalCount * 100),
    count: cache[lang]
  }
})

const topN = (arr, key, n = 5, excludeNull = true, excludeZeros = true) => {
  const sorted = arr
    .filter(repo => excludeNull ? repo.lang !== 'null' : true)
    .filter(repo => excludeZeros ? repo.score !== 0 : true)
    .sort((a, b) => {
      const left = a[key]
      const right = b[key]
      return sortNumbers(left, right)
    })
  return sorted.slice(0, n)
}

function sortNumbers (left, right) {
  if (left > right) {
    return -1
  } else if (left === right) {
    return 0
  } else if (left < right) {
    return 1
  }
}

const top5 = topN(scores, 'score', 10)
console.log('top5:')
top5.forEach(({ lang, score, count }) => console.log(`  ${lang}: ${score}%, ${count} repos`))

const wordVectors = user.data.reduce((acc, repo) => {
  return acc.concat(repo.description ? repo.description.split(' ').map(str => str.toLowerCase()) : [])
}, [])

const wordDict = wordVectors.reduce((cache, word) => {
  if (!cache[word]) {
    cache[word] = 0
  }
  cache[word] += 1
  return cache
}, {})

const stopwords = [
  'i',
  'me',
  'my',
  'myself',
  'we',
  'our',
  'ours',
  'ourselves',
  'you',
  'your',
  'yours',
  'yourself',
  'yourselves',
  'he',
  'him',
  'his',
  'himself',
  'she',
  'her',
  'hers',
  'herself',
  'it',
  'its',
  'itself',
  'they',
  'them',
  'their',
  'theirs',
  'themselves',
  'what',
  'which',
  'who',
  'whom',
  'this',
  'that',
  'these',
  'those',
  'am',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'having',
  'do',
  'does',
  'did',
  'doing',
  'a',
  'an',
  'the',
  'and',
  'but',
  'if',
  'or',
  'because',
  'as',
  'until',
  'while',
  'of',
  'at',
  'by',
  'for',
  'with',
  'about',
  'against',
  'between',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'to',
  'from',
  'up',
  'down',
  'in',
  'out',
  'on',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'here',
  'there',
  'when',
  'where',
  'why',
  'how',
  'all',
  'any',
  'both',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  's',
  't',
  'can',
  'will',
  'just',
  'don',
  'should',
  'now'
]
const topWords = Object.keys(wordDict).map(word => {
  return {
    word,
    count: wordDict[word]
  }
}).filter(({ word, score }) => {
  return !stopwords.includes(word)
}).sort((a, b) => {
  const [left, right] = [a.count, b.count]
  return sortNumbers(left, right)
}).slice(0, 10)

console.log('topWords')
topWords.forEach(({ word, count }) => {
  console.log(`  ${word}: ${count} times`)
})
