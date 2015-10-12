var nap    = require('../src/nap')
  , test   = require('tape')

test("Responding ok should yield a successful response", function(t) {
  t.plan(1)

  t.deepEqual(nap.responses.ok('hello'),
    { body: "hello"
    , statusCode : 200
    , headers : {}
    }
  , '200 OK'
  )
})