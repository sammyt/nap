module.exports = forward

function forward(url, handler) {
  return function(req, res) {
    req.uri = url
    handler(req, res)
  }
}