nap = (function environment(nap_window){

var nap = { environment: environment }
  , nap_window = nap_window || window
  , nap_document = nap_window.document
  
nap.web = newWeb
nap.negotiate = { 
  selector : bySelector
, ordered  : byOrdered
, method   : byComparator(matchMethod, "405 Method Not Allowed")
, accept   : byComparator(matchAcceptType, "415 Unsupported Media Type", setContentType)
, invoke   : invoke
}
nap.into = into

function into(node) {
  return function(res) {
    if(res.status != "200 OK") {
      console.log(res.status)
      return
    }
    var view = res.body
    view.call(node, res.params)
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

function byOrdered(fns, error){
  
  return function(req, res, response){
    var scope = this
    if(!fns.length){
      !response.status && (response.status = error)
      res(error || "No handers specified")
      return
    }

    next([].concat(fns))

    function next(fns){
      var fn = fns.shift()
      if(!fn){
        !response.status && (response.status = error)
        res(error || "All handlers failed")
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
      , response
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
  
  return function(res){
    var node = this
      , called = false

    called = options.some(function(option){
      if(is(node, option.selector)){
        option.fn.call(node, res)
        return true
      }
    })

    if(!called){
      res("No matches found")
    }
  }
}

function matchMethod(req, method) {
  return req.method == method
}

function matchAcceptType(req, acceptType) {
  return req.headers.accept == acceptType
}

function setContentType(res, value) {
  res.headers["Content-type"] = value
}

function byComparator(matches, error, update){
  return function(map){

    var order = Object.keys(map)
      .map(function(key){
        return handleKey(key, map[key], matches, update)
      })

    return function(req, res, response){
      var fn = byOrdered.call(null, order, error)
      invoke(this, fn, req, res, response)
    }
  }
}

function handleKey(key, fn, matches, update){
  return function(req, res, response){
    if(matches(req, key)){
      update && update(response, key)
      invoke(this, fn, req, res, response)
      return
    }
    res("No Match")
  }
}

function invoke(scope, fn, req, cb, response){
  fn.call(scope, req, cb, response)
}

function respond(cb, res) {
  return function(err, data) {
    res.body = data
    !res.status && (res.status = err || "200 OK")
    cb(res)
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
      , response
    
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
      cb(req.uri + " not found")
      return;
    }

    req.params = match.params

    response = {
      uri : req.uri
    , method : req.method
    , status : null
    , headers : {
        "Content-type" : "application/x.nap.view"
      } 
    , body : null
    , params : req.params
    }

    invoke(this, match.fn, req, respond(cb, response), response)

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