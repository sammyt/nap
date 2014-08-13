module.exports = forward

function forward(url, handler) {
  return function(req, res) {
    req.via = [].concat(req.via, req.uri).filter(falsy)
    req.uri = url
    handler(req, res)
  }
}

function falsy(x) { return !!x }