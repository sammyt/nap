// TODO
// status / statusCode
// err, data signature for callbacks
// call res with node
// middleware 
// exceptions vs 400 responses


nap = (function environment(nap_window){

var nap = { environment: environment }
  , nap_window = nap_window || window
  , nap_document = nap_window.document
  
nap.web = newWeb
nap.negotiate = { 
  selector : bySelector
, ordered  : byOrdered
, method   : byNegotiation(matchMethod, noop, setStatusCode(405))
, accept   : byNegotiation(matchAcceptType, setContentType, setStatusCode(415))
}
nap.into = into

function into(node) {
  return function(err, res) {
    if(res.statusCode != 200 || res.headers.contentType != "application/x.nap.view") {
      return
    }
    var view = res.body
    view(node)
  }
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
  
  return function(node, cb){
    var called = false
      , cb = cb || noop

    called = options.some(function(option){
      if(is(node, option.selector)){
        option.fn.call(null, node)
        cb(null, option.selector)
        return true
      }
    })

    if(!called) cb("No matching selector")
  }
}

function byOrdered(fns, setErrorStatus){
  
  return function(req, res){
    var response = this

    if(!fns.length){
      setErrorStatus(response)
      res("No handers specified")
      return
    }

    next([].concat(fns))

    function next(fns){
      var fn = fns.shift()
      if(!fn){
        setErrorStatus(response)
        res("All handlers failed")
        return
      }

      invoke(
        response
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

function matchMethod(req, method) {
  return req.method == method
}

function matchAcceptType(req, acceptType) {
  return req.headers.accept == acceptType
}

function setContentType(response, value) {
  response.headers.contentType = value
}

function setStatusCode(statusCode) {
  return function(response) {
    !response.statusCode && (response.statusCode = statusCode)
  }
}

function byNegotiation(comparator, action, error){
  return function(map){

    var order = Object.keys(map)
      .map(function(key){
        return handleKey(key, map[key], comparator, action)
      })

    function handler(req, res){
      var fn = byOrdered.call(null, order, error)
      invoke(this, fn, req, res)
    }
    
    handler.scoped = true // limit response scope access to internal functions only
    return handler
  }
}

function handleKey(key, fn, compare, update){
  return function(req, res){
    if(compare(req, key)){
      var response = this
      update(response, key)
      invokeHandler(response, fn, req, res)
      return
    }
    res("No Match")
  }
}

function invokeHandler(scope, fn, req, cb){
  scope = fn.scoped ? scope : null
  invoke(scope, fn, req, cb)
}

function invoke(scope, fn, req, cb){
  fn.call(scope, req, cb)
}

function response(cb, res) {
  return function(err, data) {
    res.body = data
    !res.statusCode && (res.statusCode = 200)
    cb(err, res)
  }
}

function newWeb(){
  var web = {}
    , view = nap_document.documentElement
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
      , cb = cb || noop 
      , res
    
    if(isStr(path)){
      req = {
        uri: path
      , method : "get"
      , headers : {
          accept: "application/x.nap.view"
        }
      }
    }

    req.web = web
    req.method || (req.method = "get")
    req.method == "get" && (delete req["body"])
    req.headers || (req.headers = {})
    req.headers.accept || (req.headers.accept = "application/x.nap.view")

    res = {
      method : req.method
    , headers : {} 
    }

    var match = routes.match(req.uri)

    if(!match) {
      res.statusCode = 404
      cb(null, res)
      return
    }

    req.params = res.params = match.params

    invokeHandler(res, match.fn, req, response(cb, res))

    return web
  }

  web.uri = function(name, params){

    var meta = resources[name]

    if(!meta) throw new Error(name + " not found")

    var parts = rhumb._parse(meta.ptn)

    return parts.reduce(
      function(uri, part){
        if(part.type == "var"){
          return [uri , params[part.input]].join("/")  
        }
        return [uri , part.input].join("/")  
      }
    , ""
    )
  }

  return web
}

return nap
})()