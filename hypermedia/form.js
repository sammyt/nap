module.exports = form

function form(req, rel, url, method, data) {
  submit.rel    = rel
  submit.url    = url
  submit.data   = data
  submit.method = method

  return submit

  function submit(res) {
    req(
      { uri    : submit.url
      , method : method || submit.method || 'GET'
      , params : merge(submit.fields, data)
      }
    , res
    )
  }
}

function merge(a, b) {
  return [].slice.call(arguments)
    .reduce(function(all, map) {
      Object.keys(map || {}).forEach(function(k) {
        all[k] = map[k]
      })

      return all
    }, {})
}