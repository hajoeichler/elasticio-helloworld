basedir = '../'

services = require basedir + 'services.js'

describe 'Elastic Integration', ->
  beforeEach ->
    console.log('huhu')

  it 'debug', ->
    services.debug('Hi Debug World')
