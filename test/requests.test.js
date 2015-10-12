var test = require('tape')
  , nap  = require('../src/nap')

test("Requests should take callback for responses", function(t){
  t.plan(2)

  var web = nap.web()

  web.resource("/foo/bar", function(req, res){
      res(null, nap.responses.ok("where am i?"))
    }
  )

  web.req("/foo/bar", function(err, res) {
    t.equal(res.body, "where am i?")
    t.equal(res.statusCode, 200)
  })
})

test("Requests should by default have method of 'get'", function(t){
  t.plan(1)

  var web = nap.web()

  web.resource("/yo", function(req) {
    t.equal(req.method, 'get')
  })

  web.req("/yo")
})

test("Requests should by default have accept type of 'application/x.nap.view'", function(t){
  t.plan(1)
  
  var web = nap.web()

  web.resource("/yo", function(req){
    t.equal(req.headers.accept, 'application/x.nap.view')
  })

  web.req("/yo")
})