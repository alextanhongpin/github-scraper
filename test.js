const user = require('./data/alextanhongpin.json')
console.log(user.data.length)

const cache = user.data.reduce((acc, repo) => {
  if (!acc[repo.language]) {
    acc[repo.language] = 0
  }
  acc[repo.language] += 1
  return acc
}, {})

const totalCount = Object.values(cache).reduce((l, r) => l + r, 0)
console.log(totalCount)

const percentage = Object.keys(cache).map((language) => {
  return {
    language,
    percentage: Math.round(cache[language] / totalCount * 100)
  }
})

console.log(percentage)
