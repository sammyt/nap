module.exports = link

function link(web, rel, url, method, params) {
  Object.defineProperties(activate,
    { rel    : { value: rel }
    , url    : { get: function() { return web.uri(url, activate.params) } }
    , method : { value: method || 'get' }
    , params : { writable: true, value: params }
    }
  )
  
  return activate

  function activate(callback) {
    web.req(
      { uri    : web.uri(activate.url, activate.params)
      , method : activate.method || 'get'
      }
      , callback
    )
  }
}

link.header = function(res, link) {
  res.headers || (res.headers = {})
  res.headers.link = (res.headers.link || []).concat(link)
}

var response = require('../response/response')