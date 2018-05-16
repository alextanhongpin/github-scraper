import * as express from 'express'
import { Ok, BadRequest } from '../helper/http-response'

const Route = (service: any): express.Router => {
  let router: express.Router = express.Router()

  router.get('/', async (req, res) => {
    const { limit = 10, offset = 0 } = req.query
    try {
      const repos = await service.all({ 
        limit, 
        offset 
      })
      Ok(res)(repos)
    } catch (error) {
      BadRequest(res)(error)
    }
  })

  router.get('/:login', async (req, res) => {
    const { login } = req.params
    const { exclude_fork: excludeFork } = req.query

    // TODO: Shift logic to model - route should not know too much about the logic
    try {
      const repos = await service.allByUser({ login })
      const filteredRepos = repos
      .filter((repo: any) => excludeFork === 'true' ? !repo.fork : true)
      .map((repo: any) => {
        const { owner, name, description, size, stargazers_count, watchers_count, language, forks_count } = repo
        return {
          login: owner.login,
          name,
          description,
          size,
          stargazers_count,
          watchers_count,
          language,
          forks_count
        }
      })

      Ok(res)({
        data: filteredRepos,
        count: filteredRepos.length
      })
    } catch (error) {
      BadRequest(res)(error)
    }
  })

  return router
}

export default Route