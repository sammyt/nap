var test = require('tape')
  , nap  = require('../src/nap')
  , dom  = require('jsdom').jsdom
  , d3   = require('d3')

test('Content negotiation by selector should call the correct handler', selectorSetup(function(t, node) {
  t.plan(2)
  var one = node.append('span').classed('one', true).node()

  var handler = nap.negotiate.selector(
    '.one', shouldBeCalled(t, one)
  , '.two' , shouldNotBeCalled(t)
  )

  handler(one, function(_, selector) {
    t.equal(selector, '.one', 'handler callback was invoked')
  })
}))

test('Content negotiation by selector should assess handlers in order (top to bottom)', selectorSetup(function(t, node) {
  t.plan(2)
  var one = node.append('span').classed('one', true).node()

  var handler = nap.negotiate.selector(
    '.two', shouldNotBeCalled(t)
  , '.one', shouldBeCalled(t, one)
  , '*', shouldNotBeCalled(t)
  )

  handler(one, function(_, selector) {
    t.equal(selector, '.one', 'handler callback was invoked')
  })
}))

test('Content negotiation by selector should fail when there is no match', selectorSetup(function(t, node) {
  t.plan(1)
  var three = node.append('span').classed('three', true).node()

  var handler = nap.negotiate.selector(
    '.two', shouldNotBeCalled(t)
  , '.one', shouldNotBeCalled(t)
  )

  handler(three, function(err) {
    t.equal(err, 'No matching selector', 'No matching selector')
  })
}))

test('Content negotiation by method should only accept methods where handlers are provided', function(t) {
  t.plan(2)
  var web = nap.web()

  web.resource('/sausage' , nap.negotiate.method({ get : shouldBeCalled(t) }))
  web.req('/sausage')
  web.req({ uri: '/sausage' })
  web.req({ uri: '/sausage', method : 'send' })
})

test('Content negotiation by media type should only accept types where handlers are provided', function(t) {
  t.plan(3)
  var web = nap.web()

  web.resource('/sausage' , nap.negotiate.accept({ 'application/x.nap.view' : shouldBeCalled(t) }))

  web.req('/sausage')
  web.req({ uri: '/sausage' })
  web.req({ uri: '/sausage', headers : { accept : 'application/x.nap.view' } })
  web.req({ uri: '/sausage', headers : { accept : 'json' } })
})

test('Content negotiation by method and media type should work', function(t) {
  t.plan(4)
  var web = nap.web()

  web.resource(
    '/sausage' 
  , nap.negotiate.method(
      { 
        get : nap.negotiate.accept(
          { 
            html : shouldBeCalled(t, null, 'get html') 
          , json : shouldBeCalled(t, null, 'get json')
          }
        ) 
      , send : nap.negotiate.accept(
          { 
            html : shouldBeCalled(t, null, 'send html') 
          , json : shouldBeCalled(t, null, 'send json') 
          }
        ) 
      }
    )
  )

  web.req({ uri: '/sausage', headers : { accept : 'json' } })
  web.req({ uri: '/sausage', headers : { accept : 'html' } })
  web.req({ uri: '/sausage', headers : { accept : 'json' } , method : 'send' })
  web.req({ uri: '/sausage', headers : { accept : 'html' } , method : 'send' })
})

function selectorSetup(test) {
  return function(t) {
    node = d3.select(dom().body)
      .append('div')
      .classed('nap-tests', true)

    test(t, node)

    node.remove()
  }
}

function shouldBeCalled(t, expected, name) {
  var msg = (name? name + ' ' : '') + 'handler called'

  return function(actual) {
    expected? t.equal(actual, expected, msg) : t.pass(msg)
  }
}

function shouldNotBeCalled(t) {
  return function() {
    t.fail('this handler should never be called')
  }
}