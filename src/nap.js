nap = (function environment(nap_window){

var nap = { environment: environment }
  , nap_window = nap_window || window
  , nap_document = nap_window.document
  
nap.web = newWeb
nap.negotiate = { 
  selector : bySelector
, ordered  : byOrdered
, method   : byMethod
, invoke   : invoke
}

nap.app = newApp
nap.app.view = repliesView
nap.web.fromConfig = webFromConfig

function webFromConfig(config, fn) {
  var names = Object.keys(config)
    , web = nap.web()

  names.forEach(function(name) {
    var resource = config[name], handlers = resource.handlers
    web.resource(
      name
    , resource.route
    , baseNegotiation(fn || appHandlers, handlers)
    )
  })
  web.config = config
  return web
}

function baseNegotiation(fn, handlers) {
  return function(req, res) {
    var valid = filterbyAccept(
      req.headers.accept
    , filterbyMethod(req.method, handlers)
    )
    nap.negotiate.invoke(this, fn(valid), req, res)
  }
}

function filterbyAccept(accept, handlers) {
  return handlers.filter(function(handler) {
    return handler.responds == accept
  })
}

function filterbyMethod(method, handlers) {
  return handlers.filter(function(handler) {
    return handler.method == method
  })
}

function amd(id){
  return function(req, res){
    var that = this
    require([id], function(mod){
      nap.negotiate.invoke(that, mod, req, res)  
    })
  }
}

function appHandlers(handlers){
  return nap.negotiate.ordered.apply(this, handlers.map(
    function(handler){
      if(handler.responds == 'app/view'){
        return nap.app.view(amd(handler.source))  
      }
      return amd(handler.source)
    }
  ))
}

function newApp(web){
  var inst = {}
    , baseView
    , proxy = {}

  inst.baseView = function(val){
    if(!arguments.length) return baseView
    baseView = val
    return inst
  }

  inst.config = function(val){
    if(!arguments.length) return config
    config = val
    return inst
  }

  var _req = function(path, cb){
    var req = path, locals
    
    if(isStr(path)){
      req = {
        uri: path
      , method : "get"
      }
    }

    locals = req.locals || {}
    locals.baseView = inst.baseView()

    req.locals = locals

    return web.req.apply(this,[req, cb])
  }

  var resource = function(){
    var d = web.resource.apply(this, [].slice.apply(arguments, [0]))
    return d == web ? proxy : d
  }

  proxy.req = _req
  proxy.resource = resource

  inst.web = function(){
    return proxy
  }

  return inst
}


function noop(){}

var root = nap_document.documentElement
  , matchesSelector = root.matchesSelector 
    || root.webkitMatchesSelector 
    || root.mozMatchesSelector 
    || root.msMatchesSelector 
    || root.oMatchesSelector

function is(n, s) {
  return matchesSelector.call(n, s);
}

function isFn(inst){
  return typeof inst === "function"
}

function isStr(inst){
  return typeof inst === "string"
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

function bySelector(){

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

    invoke(this, match.fn, req, cb)

    return web
  }

  return web
}

return nap
})()

if ( typeof define === "function" && define.amd ) {
  define(function () { return nap })
}