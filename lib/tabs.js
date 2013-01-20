(function(){

function findIn(parts, tree){
  var params = {}

  var find = function(remaining, node){
    
    var part = remaining.shift()

    if(!part) return node.leaf || false;

    if(node.fixed && part in node.fixed){
      return find(remaining, node.fixed[part])
    }

    if(node.partial){
      var tests = node.partial
        , found = tests.some(function(partial){
            if(partial.ptn.test(part)){
              node = partial.node
              return true
            }
          })
          
        if(found){
          return find(remaining, node)
        }
    }

    if(node.var){
      params[node.var.name] = part
      return find(remaining, node.var)
    }
    return false
  }

  var found = find(parts, tree, params)
  
  if(found){
    return {
      fn : found
    , params : params
    }
  }
  return false
}

function create (){
  var router = {}
    , tree   = {}

  

  var updateTree = function(parts, node, fn){
    var part = parts.shift()
      , more = !!parts.length
      , peek

    if(!part){ return }

    if(part.type == "fixed"){
      node["fixed"] || (node["fixed"] = {});
          
      peek = node.fixed[part.input] || (node.fixed[part.input] = {})

      if(!more){
        peek.leaf = fn
      } else {
        updateTree(parts, peek, fn)
      }
    }
    else if(part.type == "var"){
      peek = node.var || (node.var = {})
      peek.name = part.input.substr(1)

      if(!more){
        peek.leaf = fn
      } else {
        updateTree(parts, peek, fn)
      }
    }
    else throw new Error("not yet!")
  }

  router.add = function(ptn, callback){
      updateTree(parse(ptn), tree, callback)
  }

  router.match = function(path){
      var parts = path.split("/").filter(function(d){ return !!d })
        , match  = findIn(parts, tree)

      if(match){
        return match.fn.apply(match.fn, [match.params])
      }
  }    
  return router
}

function parse(ptn){
  var parts = ptn.split("/")
    .filter(function(d){ return !!d })
    .map(function(d){
      var type = (d[0] == ":")  ? "var" : "fixed";
      return {
        "type"  : type,
        "input" : d
      }
    })

  return parts
}

tabs = create()
tabs.create = create
tabs.parse = parse
tabs._findInTree = findIn

})()


