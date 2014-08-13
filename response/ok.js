module.exports = ok

function ok(body) {
  return response(body? 200 : 204, {}, body)
}

var response = require('./response')