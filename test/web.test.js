var nap    = require('../lib/nap')
  , test   = require('tape')
  , get    = require('funkis').get

test('Web instances', function(t) {
  t.plan(1)

  var w1 = nap.web()
    , w2 = nap.web()

  t.notEqual(nap.web(), nap.web(), 'should be distinct')
})

test('Web resources belong to a single web', function(t) {
  t.plan(2)

  var w1 = nap.web()
    , w2 = nap.web()
    , fn = function() {}

  w1.resource('/wibble', fn)
  t.equal(get(w1.resource('/wibble'), 'handler'), fn, 'resource added to w1')
  t.notOk(w2.resource('/wibble'), 'resource not added to w2')
})

test('Web resources can be named', function(t) {
  t.plan(2)

  var web = nap.web()
    , fn = function() { return true }

  web.resource('wobble', '/foo/bar', fn)
  t.equal(get(web.resource('wobble'), 'handler'), fn, 'resource added')
  t.ok(web.req('/foo/bar'), 'handler called')
})

test('Web resources can be anonymous', function(t) {
  t.plan(2)
  
  var web = nap.web()
    , fn = function() { return true }

  web.resource('/foo/{val}', fn)
  t.equal(get(web.resource('/foo/{val}'), 'handler'), fn, 'resource added')
  t.ok(web.req('/foo/bean'), 'handler called')
})

test('Web resource requests are routed via URI', function(t) {
  t.plan(1)

  var web = nap.web()

  web.resource('/foo/bar', handler)
  web.req('/foo/bar')

  function handler(req) {
    t.deepEqual(req,
      { uri: '/foo/bar'
      , web: web
      , method: 'get'
      , headers: { accept: 'application/x.nap.view' }
      , params: {}
      }
    , 'handler called'
    )
  }
})

test('Web resource handlers should invoke a response callback if given', function(t) {
  t.plan(1)
  var web = nap.web()

  web.resource('/foo/bar', function(req, res) {
    res(null, nap.responses.ok('where am I?'))
  })

  web.req('/foo/bar', function(err, res) {
    t.deepEqual(res,
      { body: 'where am I?'
      , statusCode: 200
      , headers: {}
      }
    , 'callback invoked'
    )
  })
})

test("Web should respond with a 404 if no resource is found", function(t) {
  t.plan(1)
  var web = nap.web()

  web.req("/sausage", function(_, res) {
    t.deepEqual(res, { statusCode: 404, headers: {} }, '404 response received')
  })
})

test("Web should respond with a 405 if no supported method is found", function(t) {
  t.plan(1)
  var web = nap.web()

  web.resource(
    "/sausage", nap.negotiate.method({ get : function(req, res) {} })
  )

  web.req({uri: "/sausage", method: "send"}, function(_, res) {
    t.deepEqual(res, { statusCode: 405, headers: {} }, '405 response received')
  })
})

test("Web should respond with a 415 if no supported media type is found", function(t) {
  t.plan(1)
  var web = nap.web()

  web.resource(
    "/sausage" 
  , nap.negotiate.method({
      get: nap.negotiate.accept({ json: function(req,res) {} })
    })
  )
  web.req("/sausage", function(_, res) {
    t.deepEqual(res, { method: 'get', statusCode: 415, headers: {} }, '415 response received')
  })
})