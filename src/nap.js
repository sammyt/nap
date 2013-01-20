(function(){

nap = {}
nap.web = createWeb

function createWeb(){
  var web = {}

  function request(path, params){
    return { uri : path, params : params }
  }

  function response(path, params){
    return { uri : path, params : params }
  }

  web.resource = function(path, handler){
    tabs.add(path, function(params){
      return {
        fn : handler
      , params : params
      }
    })
    return web
  }

  web.req = function(path, callback){
    var match = tabs.match(path)
    if(!match) throw Error("no match")

    var req = request(path, match.params)
      , res = response(path, match.params)
    
    function responder(body){
      res.body = body
      callback(false, res)
    }
    match.fn.apply(this, [req, responder])
    return web
  }
  return web
}

})()