nap = (function environment(nap_window){

var nap = { environment: environment }
  , nap_window = nap_window || window
  , nap_document = nap_window.document
  
nap.web = newWeb
nap.is = is
nap.negotiate = { 
  selector : bySelector
, method   : byDispatch(wants(checkMethod, setMethod), errorsWith(405))
, accept   : byDispatch(wants(checkAcceptType, setContentType), errorsWith(415))
}
nap.responses = {
  ok : ok
, error : error
}
nap.into = into

function into(node) {
  return function(err, res) {
    if(res.statusCode != 200) return
    if(res.headers.contentType && res.headers.contentType != "application/x.nap.view") return
    if(!isFn(res.body)) return
    if(!node) return

    node.dispatchEvent && node.dispatchEvent(new Event("update"))
    res.body(node)
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

function toArray(args) {
  return [].slice.call(args)
}

function ok(data) {
  return {
    body : data
  , statusCode : 200
  , headers : {}
  }
}

function error(code) {
  return {
    statusCode : code
  , headers : {}
  }
}

function byDispatch(wants, error) {
  return function(map) {
    var args = []
    Object.keys(map).forEach(function(key) {
      args.push(wants(key, map[key]))
    })
    args.push(error)
    return dispatch.apply(null, args)
  }
}

function wants(comparator, respond) {
  return function(key, fn) {
    return function(req, res) {
      if(comparator(req, key)) {
        fn.call(null, req, respond(key, res))
        return true
      }
    }
  }
}

function checkMethod(req, method) {
  return req.method == method
}

function checkAcceptType(req, type) {
  return req.headers.accept == type
}

function setContentType(type, res) {
  return function(err, data) {
    data.headers.contentType = type
    res(err, data)
  }
}

function setMethod(type, res) {
  return function(err, data) {
    data.method = type
    res(err, data)
  }
}

function errorsWith(code) {
  return function(req, res) {
    res(null, error(code))
    return true
  }
}

function dispatch() {
  var fns = toArray(arguments)
  return function() {
    var args = toArray(arguments)
    return fns.some(function(fn) {
      return fn.apply(null, args)
    })
  }
}

function bySelector(){

  var options = toArray(arguments)
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

    var match = routes.match(req.uri)

    if(!match) {
      cb(null, error(404))
      return
    }

    req.params = match.params
    match.fn.call(null, req, cb)

    return web
  }

  web.uri = function(ptn, params){

    var meta = resources[ptn]
    if(meta) ptn = meta.ptn
    var parts = rhumb._parse(ptn)

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