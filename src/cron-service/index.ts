import Model from './model'
import * as cron from 'node-cron'

const Service = (config: any, db: any, repoService: any, searchService: any, userService: any, analyticService: any) => {
  // Setup the model
  const model = Model(config, db, repoService, searchService, userService, analyticService)

  // fetch will fetch new Github users daily based on the last delta timestamp
  const fetch = (tab: string): any => {
    return cron.schedule(tab, async function() {
      try {
        console.log(`cron::fetch => ${tab}`)
        await model.fetch()
        console.log('cron::fetch => success')
      } catch (error) {
        console.log('cron::fetch => error:', error.message)
      }
    }, false)
  }

  // update will update existing user information by continuously pulling data from Github
  const update = (tab: string): any => {
    return cron.schedule(tab, async function() {
      try {
        console.log(`cron::update => ${tab}`)
        await model.update()
        console.log('cron::update => success')
      } catch (error) {
        console.log('cron::update => error:', error.message)
      }
    }, false)
  }

  const profile = (tab: string): any => {
    return cron.schedule(tab, async function() {
      try {
        console.log(`cron::profile => ${tab}`)
        await model.profile()
        console.log('cron::profile => success')
      } catch (error) {
        console.log('cron::profile => error:', error.message)
      }
    }, false)
  }

  const analytic =  (tab: string): any => {

    return cron.schedule(tab, async function() {
      try {
        console.log(`cron::analytic => ${tab}`)
        await model.analytic()
        console.log('cron::analytic => success')
      } catch (error) {
        console.log('cron::analytic => error:', error.message)
      }
    }, false)
  }

  return {
    fetch,
    update,
    profile,
    analytic
  }
}

export default Service