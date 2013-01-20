(function(){

nap = {}
nap.web = newWeb

function newWeb(){
  var web = {}
  
  web.resource = function(path, handler){
    tabs.add(path, function(params){
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
    
    cb && args.push(responder(cb, res))
    match.fn.apply(this, args)
    return web
  }
  
  return web

  function responder(cb, res){
    return function(body){
      res.body = body
      cb(false, res)
    }
  }

  function pkg(path, params){
    return { uri : path, params : params }
  }
}

})()