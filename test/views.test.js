var test = require('tape')
  , nap  = require('../lib/nap')
  , dom  = require('jsdom').jsdom
  , d3   = require('d3')

test('nap.into a dom node should invoke the response body on that node', setup(function(t, node) {
  t.plan(1)
  var view = nap.into(node)

  view(null, {
    headers: { contentType: "application/x.nap.view" }
  , statusCode: 200
  , body: function(n) {
      t.equal(n, node, 'body invoked')
    }
  })
}))

test("nap.into should do nothing for non 200 status codes", setup(function(t, node) {
  t.plan(1)
  var view = nap.into(node)

  view(null, {
    headers : {
      contentType : "application/x.nap.view"
    }
  , statusCode : 404
  , body: t.fail
  })

  t.pass('body not invoked')
}))

test("should do nothing if the content type is not a nap view", setup(function(t, node) {
  t.plan(1)
  var view = nap.into(node)

  view(null, {
    headers : {
      contentType : "application/json"
    }
  , statusCode : 200
  , body: t.fail
  })

  t.pass('body not invoked')
}))

function setup(test) {
  return function(t) {
    node = d3.select(dom().body)
      .append("div")
      .classed("nap-tests", true)
      .node()

    test(t, node)

    node.parentNode.removeChild(node)
  }
}
