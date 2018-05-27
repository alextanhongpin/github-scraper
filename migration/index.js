
const {Server, MongoClient} = require('mongodb')
const legacyDb = require('./legacy')
const moment = require('moment')

const connect = async ({ user = 'root', password = 'example', authSource = 'admin' }) => {
  return new MongoClient(new Server('127.0.0.1', 27017), {
    user,
    password,
    authSource
  }).connect()
}

async function main () {
  const client = await connect({})
  const db = await client.db('scraper')
  const collection = {
    users: db.collection('users'),
    repos: db.collection('repos')
  }

  const i1 = await collection.users.ensureIndex({ login: 1 }, { unique: true })
  const i2 = await collection.repos.ensureIndex({ nameWithOwner: 1 }, { unique: true })
  console.log('index', i1, i2)

  const c1 = await collection.users.count({})
  console.log('users:', c1)
  const c2 = await collection.repos.count({})
  console.log('repos:', c2)

  await collection.repos.remove({})
  await collection.users.remove({})

  const users = await getUsers()
  const bulk = await collection.users.bulkWrite(users)
  console.log('users', bulk)

  const repos = await getRepos()
  const bulk2 = await collection.repos.bulkWrite(repos)
  console.log('repos', bulk2)
  client.close()
}

main().catch(console.error)

function mapLegacyUser (doc) {
  return {
    name: doc.name,
    createdAt: moment().utc().format(doc.created_at),
    updatedAt: moment().utc().format(doc.updated_at),
    login: doc.login,
    bio: doc.bio,
    location: doc.location,
    email: doc.email,
    company: doc.company,
    avatarUrl: doc.avatar_url,
    websiteUrl: doc.blog,
    repositories: doc.public_repos,
    gists: doc.public_gists,
    followers: doc.followers,
    following: doc.following
  }
}

function newBulkUser (user) {
  return {
    updateOne: {
      filter: {
        login: user.login
      },
      update: {
        $set: user
      },
      upsert: true
    }
  }
}

function mapLegacyRepo (doc) {
  return {
    name: doc.name,
    createdAt: moment().utc().format(doc.created_at),
    updatedAt: moment().utc().format(doc.updated_at),
    description: doc.description,
    languages: [doc.language].filter((lang) => lang),
    homepageUrl: doc.homepage,
    isFork: doc.fork,
    forks: doc.forks,
    nameWithOwner: doc.full_name,
    stargazers: doc.stargazers_count,
    watchers: doc.watchers_count,
    login: doc.owner.login,
    avatarUrl: doc.owner.avatar_url,
    url: doc.html_url
  }
}

function newBulkRepo (repo) {
  return {
    updateOne: {
      filter: {
        nameWithOwner: repo.nameWithOwner
      },
      update: {
        $set: repo
      },
      upsert: true
    }
  }
}

function getUsers () {
  return new Promise((resolve, reject) => {
    legacyDb.users.find({}, async (err, docs) => {
      if (err) {
        return reject(err)
      }
      return resolve(docs.map(mapLegacyUser).map(newBulkUser))
    })
  })
}

function getRepos () {
  return new Promise((resolve, reject) => {
    legacyDb.repos.find({}, async (err, docs) => {
      if (err) {
        return reject(err)
      }
      return resolve(docs.map(mapLegacyRepo).map(newBulkRepo))
    })
  })
}
