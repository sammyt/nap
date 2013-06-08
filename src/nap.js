define(function(require){

var nap = {}
  , rhumb = require('rhumb')
  
nap.web = newWeb
nap.web.fromConfig = webFromConfig

nap.negotiate = { 
  selector : bySelector
, ordered  : byOrdered
, method   : byMethod
, content  : byContent
}

nap.handlers = {
  invoke : invoke
, view : repliesView
}


function isFn(inst){
  return typeof inst === "function"
}

function isStr(inst){
  return typeof inst === "string"
}

function noop(){}

function webFromConfig(config) {
  var names = Object.keys(config)
    , web = nap.web()

  names.forEach(function(name) {
    var resource = config[name], specs = resource.handlers
    web.resource(
      name
    , resource.route
    , negotiation(specs)
    )
  })
  web.config = config
  return web
}

function negotiation(specs) {

  var handlers = []

  specs.forEach(function(spec){
    handlers.push(module(spec.source))
  })

  specs.forEach(function(spec, i){
    if(spec.responds == 'app/view'){
      handlers[i] = nap.handlers.view(handlers[i])
    }
  })

  specs.forEach(function(spec, i){
    var bycontent = {}
    bycontent[spec.responds] = handlers[i] 
    handlers[i] = nap.negotiate.content(bycontent)
  })
    
  var methods = {}
  specs.forEach(function(spec, i){
    [].concat(spec.method)
      .forEach(function(method){
        methods[method] || (methods[method] = [])
        methods[method].push(handlers[i])
      })
  })

  Object.keys(methods).forEach(function(method){
    methods[method] = nap.negotiate.ordered.apply(this, methods[method])
  })


  return nap.negotiate.method(methods)
}

function module(id){
  return function(req, res){
    var that = this
      , r = req.locals.require || require

    r([id], function(mod){
      nap.handlers.invoke(that, mod, req, res)  
    })
  }
}


function byOrdered(){
  var fns = [].slice.apply(arguments, [0])
  
  return function(req, res){
    var scope = this
    if(!fns.length){
      res("No handers specified")
      return
    }

    next([].concat(fns))

    function next(fns){
      var fn = fns.shift()
      if(!fn){
        res("All handlers failed")
        return
      }
      invoke(
        scope
      , fn
      , req
      , function(err, data){
          if(err){
            next(fns)
          } else {
            res(err, data)
          }
        }
      )
    }
  }
}


function byContent(pair){
  return function(req, res){
    var fn = pair[req.headers.accept]
    fn && invoke(this, fn, req, res)
  }
}

function bySelector(){
  
  /*
  var nap_window = nap_window || window
    , nap_document = nap_window.document
    , root = nap_document.documentElement
      , matchesSelector = root.matchesSelector 
        || root.webkitMatchesSelector 
        || root.mozMatchesSelector 
        || root.msMatchesSelector 
        || root.oMatchesSelector

  function is(n, s) {
    return matchesSelector.call(n, s);
  }
  */

  function is(n, s) {
    return true
  }

  var options = [].slice.apply(arguments, [0])
    .reduce(
      function(curr, next){
        if(isStr(next)) curr.push({ selector : next })
        else curr[curr.length - 1].fn = next
        return curr
      }
    , []
    )
  
  return function(req, res){
    var node = this instanceof nap_window.HTMLElement 
        ? this 
        : req.web.view()
      , called = false

    called = options.some(function(option){
      if(is(node, option.selector)){
        invoke(node, option.fn, req, res)
        return true
      }
    })

    if(!called){
      res("No matches found")
    }
  }
}

function byMethod(map){

  var order = Object.keys(map)
    .map(function(method){
      return handleMethod(method, map[method])
    })

  return function(req, res){
    var fn = byOrdered.apply(null, order)
    invoke(this, fn, req, res)
  }
}

function handleMethod(method, fn){
  return function(req, res){
    if(req.method == method){
      invoke(this, fn, req, res)
      return
    }
    res("Method Not Supported")
  }
}

function repliesView(fn){
  return function(req, res){
    var node = this instanceof nap_window.HTMLElement 
      ? this 
      : req.locals.baseView

    invoke(node, fn, req, res)
  } 
}

function invoke(scope, fn, req, cb){
  var sync = false
    , args = [req]
    
  if(fn.length > 1) {
    args.push(isFn(cb) ? cb : noop)
  } else {
    sync = true
  }
  
  fn.apply(scope, args);

  if(sync && isFn(cb)){ 
    cb() 
  }
}

function newWeb(){
  var web = {}
    , resources = {}
    , routes = rhumb.create()
  
  web.resource = function(name, ptn, handler){
    if(arguments.length == 1) return resources[name]

    if(arguments.length == 2) {
      handler = ptn
      ptn = name
    }

    resources[name] = {
      name : name
    , ptn : ptn
    , handler : handler
    }
    
    routes.add(ptn, function(params){
      return {
        fn : handler
      , params : params
      }
    })
    return web
  }

  web.req = function(path, cb){
    
    var req = path
    
    if(isStr(path)){
      req = {
        uri: path
      , method : "get"
      }
    }

    req.web = web
    req.method || (req.method = "get")
    req.method == "get" && (delete req["body"])

    var match = routes.match(req.uri)
    if(!match) {
      cb(req.uri + " not found")
      return;
    }

    req.params = match.params
    req.locals = req.locals || {}

    invoke(this, match.fn, req, cb)

    return web
  }

  return web
}

return nap  
})
