basedir = '../'

services = require basedir + 'services.js'

describe 'Elastic Integration', ->
  beforeEach (done) ->
    console.log('before')

  it 'debug', ->
    services.createProduct("123", '{}');

#  it 'get access token throws error with wrong config', ->
#    expect( -> services.login('foo', '123', 'abc')).toThrow('Failed to get access token.');

#  doneFunc = (access_token) ->
#    expect(access_token).toMatch(/[a-zA-Z0-9_]/)
#
#  it 'get access token', ->
#    services.login('fedora1', 'RNwKAtQ1y-ArZu1ah1STjL9P', 'AO_nEVb77TSSI_95rpgLv6a1TXRY5Zpm', doneFunc )

  it 'get access token', doneFunc ->
    services.login('fedora1', 'RNwKAtQ1y-ArZu1ah1STjL9P', 'AO_nEVb77TSSI_95rpgLv6a1TXRY5Zpm', doneFunc )
