basedir = '../'

services = require basedir + 'services.js'
sphere = require basedir + 'sphere.js'

describe 'elastic.io integration', ->
  it 'login', ->
    sphere.login('snowflake2', 'QKStD-HjZLZGRqie2SPvzXSt', 'lnkNveGqslWKwt-qVE5yqVE0KBKM-sQL', (p, t) ->
      expect(t).not.toBeUndefined()
      asyncSpecDone()
    )
    asyncSpecWait()

  it 'getOrders', ->
    sphere.login('snowflake2', 'QKStD-HjZLZGRqie2SPvzXSt', 'lnkNveGqslWKwt-qVE5yqVE0KBKM-sQL', (p, t) ->
      sphere.getOrders(p, t, (r) ->
        expect(r).not.toBeUndefined()
        asyncSpecDone()
      )
    )
    asyncSpecWait()

  it 'full turn around', ->
    sphere.login('kokon-03', 'yPv0KFPAhxSdcI4ftb_tF3Cr', '_S4yejpVZWHRFDcEmfR50RpAj9T30XfO', (p, t) ->
      sphere.getOrders(p, t, (r) ->
        services.mapOrders(r, (finish) ->
          asyncSpecDone()
        )
      )
    )
    asyncSpecWait()
