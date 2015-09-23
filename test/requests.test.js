var test = require('tape')
  , nap  = require('../src/nap')

  //   t.test("should should take callback for responses", function(t){
  //     var web = nap.web()
  //       , cb = sinon.spy()

  //     web.resource("/foo/bar", function(req, res){
  //         res(null, nap.responses.ok("where am i?"))
  //       }
  //     )

  //     web.req("/foo/bar", cb)

  //     cb.should.have.been.calledOnce

  //     cb.args[0][1].body.should.equal("where am i?")
  //     cb.args[0][1].statusCode.should.equal(200)
  //   })
  //   t.test("be default requests have method of 'get'", function(t){
  //     var web = nap.web()
  //       , request

  //     web.resource("/yo", function(req){
  //       request = req
  //     })

  //     web.req("/yo")

  //     expect(request.method).to.equal("get")
  //   })
  //   t.test("be default requests have accept type of 'application/x.nap.view'", function(t){
  //     var web = nap.web()
  //       , request

  //     web.resource("/yo", function(req){
  //       request = req
  //     })

  //     web.req("/yo")

  //     expect(request.headers.accept).to.equal("application/x.nap.view")
  //   })
  // })