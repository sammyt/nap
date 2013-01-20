(function(){

nap = {}
nap.web = createWeb

function createWeb(){
  var web = {}

  function request(path, params){
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

  web.req = function(path){
    var match = tabs.match(path)
    if(!match) throw Error("no match")
    match.fn.apply(this, [request(path, match.params)])
    return web
  }
  return web
}

})()