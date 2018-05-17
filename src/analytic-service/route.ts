import * as express from 'express'
import { Ok, BadRequest } from '../helper/http-response'

const Route = (service: any): express.Router => {
  let router: express.Router = express.Router()

  router.get('/', async (req, res) => {
    const { type } = req.query
    try {
      const data = await service.getAnalytics(type)
      Ok(res)(data)
    } catch (error) {
      BadRequest(res)(error)
    }
  })

  router.get('/profiles', async (req, res) => {
    const { login } = req.query
    try {
      const data = await service.getProfile(login)
      Ok(res)(data)
    } catch (error) {
      BadRequest(res)(error)
    }
  })

  return router
}

export default Route