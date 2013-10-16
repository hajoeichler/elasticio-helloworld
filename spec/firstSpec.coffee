basedir = '../'

services = require basedir + 'services.js'

describe 'Elastic Integration', ->
  beforeEach (done) ->
    console.log('before')
    services.login('snowflake2', 'QKStD-HjZLZGRqie2SPvzXSt', 'lnkNveGqslWKwt-qVE5yqVE0KBKM-sQL', done)

#  it 'init', ->
#    services.init(1, 2, 3)

  it 'getCustomers', ->
    services.getCustomers('snowflake2', exports.accessToken)

