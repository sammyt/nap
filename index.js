
global.window = require('domino').createWindow()
require('./nap')
delete global.window

function webFromYaml(path){
 return nap.web.fromConfig(
    configToJson(path)
  , fromHandlers
  )
}

function configToJson(path){
  var fs = require('fs')
    , jsyaml = require('js-yaml')

  return jsyaml.load(fs.readFileSync(path, {encoding: 'utf8'}))
}

nap.web.fromYaml = webFromYaml
nap.web.configToJson = configToJson

nap.express = {}
nap.express.middleware = middleware

function fromHandlers(handlers){
  return nap.negotiate.ordered.apply(
   this 
  , handlers.map(function(handler){
      return nap.app.view(amd(handler.source))
    })
  )
}

function amd(id){
  return function(req, res){
    var that = this
    req.locals.require([id], function(mod){
      nap.negotiate.invoke(that, mod, req, res)
    })
  }
}

function middleware(web){
  var configUrl = '/web-resources.json'
    , indexPath = 'index.html'
    , scopeToWindow = function(){}
    , baseNodeSelector = '#main'
    , requirejs = require('requirejs')
    , keys = Object.keys
    , fs = require('fs')
    , i = 0


  function fn(req, res, next){
    if(req.path == configUrl){
      res.send(web.config)
      return;
    }
    
    var window = require('domino').createWindow(indexHtml())
      , scoped = scopeToWindow(window)
      , node = window.document.querySelector(baseNodeSelector)
      , name , r = requirejs.config({context: (name = 'nap' + i++)})

    keys(scoped).forEach(function(name){
      requirejs.define(name, scoped[name])
    })

    var w = nap.app(web).baseView(node).web()
    
    w.req(
      { uri : req.url
      , headers: { accept: 'app/view' } 
      , locals: { require: r }
      }
    , function(err, data){
      delete requirejs.s.contexts[name]
      if(err){ next(); return }
      res.send(window.document.innerHTML)
    })
  }

  function indexHtml(){
    return fs.readFileSync(
      indexPath
    , { encoding : "utf8" }
    )
  }

  fn.configUrl = function(val){
    if(!arguments.length) return configUrl
    configUrl = val
    return fn
  }

  fn.indexPath = function(val){
    if(!arguments.length) return indexPath
    indexPath = val
    return fn
  }

  fn.scopeToWindow = function(val){
    if(!arguments.length) return scopeToWindow
    scopeToWindow = val
    return fn
  }

  fn.baseNodeSelector  = function(val){
    if(!arguments.length) return baseNodeSelector
    baseNodeSelector = val
    return fn
  }


  return fn
}

module.exports = nap
