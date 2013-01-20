(function(){

nap = {}
nap.web = createWeb

function createWeb(){
  var web = {}

  web.resource = function(path, handler){
    tab.add(path, function(){
      console.log(arguments)
      return handler
    })
    return web
  }

  web.req = function(path){
    var match = tab.match(path)
    if(!match) throw Error("no match")
    match()
  }
  return web  
}

})()

/*
var myweb = nap.web()
  .resource("/foo",  function(){ console.log("foo") })
  .resource("/bing",  function(){ console.log("bing") })
  .resource("/bing/bong",  function(){ console.log("bong") })
*/

