module.exports = error

function error(code, body) {
  code || (code = 500)
  return response(code, {}, body)
}

var response = require('./response')