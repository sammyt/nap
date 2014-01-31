nap = (function environment(nap_window){

var nap = { environment: environment }
  , nap_window = nap_window || window
  , nap_document = nap_window.document
  
nap.web = newWeb
nap.negotiate = { 
  selector : bySelector
, ordered  : byOrdered
, method   : byMethod
, accept   : byAcceptType
, invoke   : invoke
}

nap.replies = {
  view : repliesView
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

function byAcceptType(map){

  var order = Object.keys(map)
    .map(function(acceptType){
      return handleAcceptType(acceptType, map[acceptType])
    })

  return function(req, res){
    var fn = byOrdered.apply(null, order)
    invoke(this, fn, req, res)
  }
}

function handleAcceptType(acceptType, fn){
  return function(req, res){
    if(req.headers.accept == acceptType){
      invoke(this, fn, req, res)
      return
    }
    res("Accept-type Not Supported")
  }
}

function repliesView(fn){
  return function(req, res){
    var node = this instanceof nap_window.HTMLElement 
      ? this 
      : req.web.view()

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
    
    if(isStr(path)){
      req = {
        uri: path
      , method : "get"
      , headers : {
          accept: "html"
        }
      }
    }

    req.web = web
    req.method || (req.method = "get")
    req.method == "get" && (delete req["body"])
    req.headers || (req.headers = {})
    req.headers.accept || (req.headers.accept = "html")

    var match = routes.match(req.uri)
    if(!match) {
      cb(req.uri + " not found")
      return;
    }

    req.params = match.params

    invoke(this, match.fn, req, cb)

    return web
  }

  web.view = function(val){
    if(!arguments.length) return view
    view = val
    return web
  }

  web.uri = function(name, params){

    // TODO: support all ptn types

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