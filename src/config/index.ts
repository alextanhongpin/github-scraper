/*
 * src/config/index.ts
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 6/11/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/

// The default config of the application that is obtained from environment variables

import * as convict from 'convict'

const config = convict({
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 5000,
    env: 'PORT'
  },
  accessToken: {
    doc: 'The Github Access Token',
    format: String,
    default: process.env.ACCESS_TOKEN,
    env: 'ACCESS_TOKEN'
  },
  perPage: {
    doc: 'The maximum item per page for Github result',
    format: Number,
    default: 30
  },
  country: {
    doc: 'The country the Github users reside',
    format: String,
    default: 'Malaysia'
  },
  githubCreatedAt: {
    doc: 'The date Github is published - used as default date when none is found',
    format: String,
    default: new Date(2008, 3, 1).toString()
  },
  cron: {
    fetch: {
      doc: 'The crontab for the fetch cron - indicates how frequent to pool Github server to pull new users',
      format: String,
      default: '0 12 * * *',
      env: 'CRON_FETCH_TAB'
    },
    enableFetch: {
      doc: 'Feature toggle to enable the fetch cron for running',
      format: Boolean,
      default: false,
      env: 'CRON_FETCH_ENABLE'
    },
    update: {
      doc: 'The crontab for the update cron - indicates how frequent to pool Github server to update user information',
      format: String,
      default: '* * * * *',
      env: 'CRON_UPDATE_TAB'
    },
    enableUpdate: {
      doc: 'Feature toggle to enable the update cron for running',
      format: Boolean,
      default: false,
      env: 'CRON_UPDATE_ENABLE'
    },
    analytic: {
      doc: 'The crontab for the analytic cron - indicates how frequent to update the github analytic data',
      format: String,
      default: '0 12 * * *',
      env: 'CRON_ANALYTIC_TAB'
    },
    enableAnalytic: {
      doc: 'Feature toggle to enable the analytic cron for running',
      format: Boolean,
      default: false,
      env: 'CRON_ANALYTIC_ENABLE'
    },
    triggerAnalytic: {
      doc: 'Trigger the build analytic when the application starts',
      format: Boolean,
      default: false,
      env: 'CRON_ANALYTIC_TRIGGER'
    },
    profile: {
      doc: 'The crontab for the profile cron - indicates how frequent to build user profiles and matches',
      format: String,
      default: '0 12 * * *',
      env: 'CRON_PROFILE_TAB'
    },
    enableProfile: {
      doc: 'Feature toggle to enable the profile cron for running',
      format: Boolean,
      default: false,
      env: 'CRON_PROFILE_ENABLE'
    }
  }
})

const validated = config.validate({ allowed: 'strict' })

export default validated
