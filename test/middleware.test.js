var test = require('tape')
  , nap  = require('../src/nap')

test('Middleware should invoke for request and response', function(t) {
  t.plan(4)
  var web = nap.web()

  web.use(function(req, res, next) {
    // do something with req
    t.pass('request middleware called; should modify accept header')
    req.headers.accept = 'application/json'

    next(req, function(err, data) {
      // do something with res
      t.pass('response middleware called; should modify content-type header')
      data.headers.contentType = 'application/json'
      res(err, data)
    })
  })

  web.resource('/wibble', function(req, res) {
    t.equal(req.headers.accept, 'application/json', 'request middleware modified accept-type header')
    res(null, nap.responses.ok('hello'))
  })

  web.req('/wibble', function(_, res) {
    t.deepEqual(
      { body: 'hello'
      , statusCode: 200
      , headers: { contentType: 'application/json' }
      }
      , res
      , 'response middleware modified content-type header'
    )
  })
})

test('Middleware should be invoked in correct order', function(t) {
  t.plan(4)
  var web = nap.web()
    , seq = [1, 2, 3, 4]

  web.use(
    function(req, res, next) {
      t.equal(seq.shift(), 1, 'first request middleware invoked')

      next(req, function(err, data) {
        t.equal(seq.shift(), 4, 'last response middleware invoked')
        res(err, data)
      })
    }
  , function(req, res, next) {
      t.equal(seq.shift(), 2, 'last request middleware invoked')

      next(req, function(err, data) {
        t.equal(seq.shift(), 3, 'first response middleware invoked')
        res(err, data)
      })
    }
  )

  web.resource('/wibble', function(req, res) {
    res(null, nap.responses.ok('hello'))
  })

  web.req('/wibble')
})