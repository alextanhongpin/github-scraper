import * as express from 'express'
import { Ok, BadRequest } from '../helper/http-response'

const Route = (service: any): express.Router => {
  let router: express.Router = express.Router()

  router.get('/', async (req, res) => {
    const { limit = 10, offset = 0 } = req.query

    try {
      const [users, countResponse] = await Promise.all([
        service.all({ limit, offset }),
        service.count({})
      ])

      Ok(res)({
        data: users,
        count: countResponse.totalCount
      })
    } catch (error) {
      BadRequest(res)(error)
    }
  })

  router.get('/:login', async (req, res) => {
    try {
      const user = await service.getOne({ 
        login: req.params.login 
      })
      Ok(res)({
        data: user
      })
    } catch (error) {
      BadRequest(res)(error)
    }
  })

  return router
}

export default Route