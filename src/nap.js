(function(){

nap = {}
nap.web = createWeb

function createWeb(){
  var web = {}

  function request(path){
    return { uri : path }
  }

  web.resource = function(path, handler){
    tabs.add(path, function(){
      return {
        fn : handler
      , path : path
      }
    })
    return web
  }

  web.req = function(path){
    var match = tabs.match(path)
    if(!match) throw Error("no match")
    match.fn.apply(match.fn, [request(match.path)])
  }
  return web  
}

})()