# github-scraper

Scrapes public repos based on a particular keyword or location.

## Issues

```bash
{"message":"Only the first 1000 search results are available","documentation_url":"https://developer.github.com/v3/search/"}
```

## Installation

First, you have to install [Yarn](https://yarnpkg.com/lang/en/docs/install/). Then:

```bash
# This will install all dependencies from package.json
$ yarn install

# We use foreman to load the environment variables from `.env` file.
# This is important to prevent accidental commit of sensitive data to github
$ yarn global add foreman
```

## Add/Remove packages

```bash
$ yarn add <PACKAGE_NAME>
$ yarn add --dev <PACKAGE_NAME>
$ yarn remove <PACKAGE_NAME>
```

## Environment

For development, store all the environment variable in the `.env` file. This will be included in `.gitignore` so that it will not be commited to github.
Make sure you create the `.env` file or the service will not run.

The `.env` should contain the following:

```bash
# Create a personal access token from Github.
# It should contain the minimum scope repo::public_repo and user::read:user
ACCESS_TOKEN=<YOUR_GITHUB_ACCESS_TOKEN>
```

## Start

```bash
# If you do not have `foreman` installed globally
$ yarn global add foreman

# or
$ npm i -g foreman

# Start
$ nf start
```

## API Calls

### Analytics Endpoint

`GET /analytics?type=<TYPE>`:

- user_count
- user_count_by_years
- repo_count
- leaderboard_last_updated_repos
- leaderboard_most_stars_repos
- leaderboard_most_watchers_repos
- leaderboard_most_repos
- leaderboard_most_repos_by_language
- leaderboard_languages

`GET /analytics/profiles?login=<GITHUB_LOGIN_NAME>`

### Users Endpoint

`GET /users/<GITHUB_LOGIN_NAME>`

### Repos Endpoint

`GET /repos/<GITHUB_LOGIN_NAME>`

## TODO

- [ ] ensure only unique repos for a particular user are added (no duplications)
- [ ] check for language-agnostic storage solution

<!-- // Getting top 10 users
db.users.find({}).sort({
  public_repos: -1
}).limit(10).exec((error: Error, docs: any) => {
  console.log('top10 users', docs)
}) -->
