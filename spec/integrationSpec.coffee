basedir = '../'

services = require basedir + 'services.js'

describe 'elastic.io integration', ->
  it 'login', ->
    services.login('snowflake2', 'QKStD-HjZLZGRqie2SPvzXSt', 'lnkNveGqslWKwt-qVE5yqVE0KBKM-sQL', (p, t) ->
      expect(t).not.toBeUndefined()
      asyncSpecDone()
    )
    asyncSpecWait()

  it 'getOrders', ->
    services.login('snowflake2', 'QKStD-HjZLZGRqie2SPvzXSt', 'lnkNveGqslWKwt-qVE5yqVE0KBKM-sQL', (p, t) ->
      services.getOrders(p, t, (r) ->
        expect(r).not.toBeUndefined()
        asyncSpecDone()
      )
    )
    asyncSpecWait()

  it 'full turn around', ->
    services.login('snowflake2', 'QKStD-HjZLZGRqie2SPvzXSt', 'lnkNveGqslWKwt-qVE5yqVE0KBKM-sQL', (p, t) ->
      services.getOrders(p, t, (r) ->
        services.mapOrders(r, (finish) ->
          asyncSpecDone()
        )
      )
    )
    asyncSpecWait()