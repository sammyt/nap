module.exports = link

function link(req, rel, url) {
  navigate.rel  = rel  || ''
  navigate.url  = url  || ''

  return navigate

  function navigate(res) {
    req(url, res)
  }
}