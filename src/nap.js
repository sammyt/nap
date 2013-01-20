(function(){

nap = {}
nap.web = newWeb

function newWeb(){
  var web = {}
    , view
    , resources = {}
  
  web.resource = function(name, ptn, handler){
    if(arguments.length == 1) return resources[name]

    if(arguments.length == 2) {
      handler = ptn
      
      if(name[0] === "/"){
        ptn = name
      } else {
        ptn = name
      }
    }

    resources[name] = {
      name : name
    , ptn : ptn
    , handler : handler
    }
    
    tabs.add(ptn, function(params){
      return {
        fn : handler
      , params : params
      }
    })
    return web
  }

  web.req = function(path, cb){
    var match = tabs.match(path)
    if(!match) throw Error("no match")

    var req = pkg(path, match.params)
      , res = pkg(path, match.params)
      , args = [req]
      , fn = match.fn
    
    if(fn.length > 1) {
      args.push(responder(cb, res))
    }

    var ctx = this instanceof HTMLElement 
      ? this
      : view

    fn.apply(ctx, args)
    return web
  }

  web.view = function(val){
    if(!arguments.length) return view
    view = val
    return web
  }

  web.uri = function(name, params){
    var meta = resources[name]

    if(!meta) throw new Error(name + " not found")

    var parts = tabs.parse(meta.ptn)

    return parts.reduce(
      function(uri, part){
        if(part.type == "var"){
          return [uri , params[part.input.substr(1)]].join("/")  
        }
        return [uri , part.input].join("/")  
      }
    , ""
    )
  }

  return web

  function responder(cb, res){
    if(isFn(cb)){
      cb = function(){}
    }
    return function(body){
      res.body = body
      cb(false, res)
    }
  }

  function pkg(path, params){
    return { uri : path, params : params }
  }

  function isFn(inst){
    return typeof inst !== "function"
  }

  function isStr(inst){
    return typeof inst !== "string"
  }
}

})()