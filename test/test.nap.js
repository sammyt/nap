describe("Nap", function(){

	describe("nap.web", function(){
    it("should be able to create web instances", function(){
      var w1 = nap.web()
        , w2 = nap.web()

      expect(w1).to.include.keys("resource", "req")
      expect(w2).to.include.keys("resource", "req")

      w1.should.not.equal(w2)
    })
  })
  describe("nap responses", function(){
    it("ok should create a 200 response", function(){
      nap.responses.ok("hello").should.deep.equal({
        body: "hello"
      , statusCode : 200
      })
    })
  })
  describe("web.resource", function(){
    it("should add a new resource to current web", function(){
      var web = nap.web()
        , other = nap.web()
        , fn = function(){}

      web.resource("/wibble", fn)

      web.resource("/wibble").should.be.ok
      web.resource("/wibble").handler.should.be.equal(fn)
      expect(other.resource("/wibble")).not.to.be.ok
    })
    it("should add resource with a name", function(){
      var web = nap.web()
        , fn = sinon.spy()

      web.resource("wobble", "/foo/bar", fn)

      web.resource("wobble").should.be.ok
      web.resource("wobble").handler.should.be.equal(fn)

      web.req("/foo/bar")
      fn.should.have.been.calledOnce
    })
    it("should add resource without a name", function(){
      var web = nap.web()
        , fn = sinon.spy()

      web.resource("/foo/{val}", fn)

      web.resource("/foo/{val}").should.be.ok
      web.resource("/foo/{val}").handler.should.be.equal(fn)

      web.req("/foo/bean")
      fn.should.have.been.calledOnce
    })
  })
  describe("web.req", function(){
    it("should find resource via url", function(){
      var web = nap.web()
        , fn = sinon.spy()

      web.resource("/foo/bar", fn)
      web.req("/foo/bar")

      fn.should.have.been.calledOnce
      
      var arg = fn.args[0][0]
      arg.uri.should.equal("/foo/bar")
      arg.params.should.eql({})
    })
    it("should should take callback for responses", function(){
      var web = nap.web()
        , cb = sinon.spy()

      web.resource("/foo/bar", function(req, res){
          res(null, "where am i?")
        }
      )

      web.req("/foo/bar", cb)

      cb.should.have.been.calledOnce
      cb.args[0][1].body.should.equal("where am i?")
      cb.args[0][1].statusCode.should.equal(200)
      cb.args[0][1].method.should.equal("get")
    })
    it("be default requests have method of 'get'", function(){
      var web = nap.web()
        , request

      web.resource("/yo", function(req){
        request = req
      })

      web.req("/yo")

      expect(request.method).to.equal("get")
    })
    it("be default requests have accept type of 'application/x.nap.view'", function(){
      var web = nap.web()
        , request

      web.resource("/yo", function(req){
        request = req
      })

      web.req("/yo")

      expect(request.headers.accept).to.equal("application/x.nap.view")
    })
  })
  describe("web.uri", function(){
    it("should generate a uri based on a named resource", function(){
      var web = nap.web()
        .resource("demo", "/my-demo", function(){})

      web.uri("demo").should.equal("/my-demo")
    })
    it("should generate a uri with params", function(){
      var web = nap.web()
        .resource("demo", "/my-demo/{id}", function(){})

      web.uri("demo", { id : "foo" }).should.equal("/my-demo/foo")
    })  
  })
  describe("web.negotiate", function(){
    describe("selector", function(){
      var node
      beforeEach(function(){
        node = d3.select("body")
          .append("div")
          .classed("nap-tests", true)
      })
      afterEach(function(){
        node.remove()
      })
      it("should call the correct handler by selector", function(){
        var one = node.append("span").classed("one", true).node()
          , o = sinon.spy()
          , t = sinon.spy()
          , cb = sinon.spy()

        var handler = nap.negotiate.selector(
          ".one", o
        , ".two" , t
        )

        handler(one, cb)

        o.should.have.been.calledOnce
        o.should.have.been.calledWith(one)
        t.should.not.have.been.called

        cb.should.have.been.calledOnce
        cb.should.have.been.calledWith(null, ".one")

      })
      it("should assess handlers in order (top to bottom)", function(){
        var one = node.append("span").classed("one", true).node()
          , o = sinon.spy()
          , t = sinon.spy()
          , cb = sinon.spy()

        var handler = nap.negotiate.selector(
          ".two", t
        , ".one", o
        , "*" , t
        )

        handler(one, cb)

        o.should.have.been.calledOnce
        o.should.have.been.calledWith(one)
        t.should.not.have.been.called

        cb.should.have.been.calledOnce
        cb.should.have.been.calledWith(null, ".one")
      })
      it("should fail when no selector matches", function(){
        var three = node.append("span").classed("three", true).node()
          , o = sinon.spy()
          , t = sinon.spy()
          , cb = sinon.spy()

        var handler = nap.negotiate.selector(
          ".two", t
        , ".one", o
        )

        handler(three, cb)

        o.should.not.have.been.called
        t.should.not.have.been.called

        cb.should.have.been.calledOnce
        cb.should.have.been.calledWith("No matching selector")
      })
    })
    describe("ordered", function(){
/*      it("should try handlers in order they are added", function(){
        var calls = []
          , error = sinon.spy()

        nap.web().resource(
          "/nothing"
        , nap.negotiate.ordered(
            [ function(req, res){ calls.push("one"), res(true) }
            , function(req, res){ calls.push("two"), res(true) }  
            ]
          , error
          )
        )
        .req("/nothing", function(err, res) {
          //console.log(err, res)
        })

        calls.should.eql(["one", "two"])
      })*/
/*      it("should fail when all handers fail", function(){
        var calls = []
          , req = sinon.spy()
          , res = sinon.spy()
          , error = sinon.spy()
          , ordered = nap.negotiate.ordered(
            [ function(req, res){ calls.push("one"), res(true, "one") }
            , function(req, res){ calls.push("two"), res(true, "two") }  
            ]
          , error
          )

        ordered.call(null, req, res)

        calls.should.eql(["one", "two"])
        res.should.have.been.calledOnce
        res.args[0][0].should.equal("All handlers failed")
        error.should.have.been.calledOnce
      })*/
/*      it("should only call handers until one succeeds", function(){
        var calls = []
          , cb = sinon.spy()
          , error = sinon.spy()

        nap.web().resource(
          "/nothing"
        , nap.negotiate.ordered(
            [ function(req, res){ calls.push("one"),   res(true, "one") }
            , function(req, res){ calls.push("two"),   res(true, "two") }
            , function(req, res){ calls.push("three"), res(false, "three") }  
            , function(req, res){ calls.push("four"),  res(false, "four") }  
            ]
          , error
          )
        )
        .req("/nothing", cb)

        calls.should.eql(["one", "two", "three"])
        cb.should.have.been.calledOnce
      })*/
    })
    describe("negotiate.method", function(){
      it("should only accept methods where handlers are provided", function(){
        var web = nap.web()
          , spy = sinon.spy()

        web.resource("/sausage" , nap.negotiate.method({ get : spy }))

        web.req("/sausage")
        web.req({ uri: "/sausage" })
        web.req({ uri: "/sausage", method : "send" })

        spy.should.have.been.calledTwice
      })
    })
    describe("negotiate.accept", function(){
      it("should only accept accept-types where handlers are provided", function(){
        var web = nap.web()
          , spy = sinon.spy()

        web.resource("/sausage" , nap.negotiate.accept({"application/x.nap.view" : spy}))

        web.req("/sausage")
        web.req({ uri: "/sausage" })
        web.req({ uri: "/sausage", headers : { accept : "application/x.nap.view" } })
        web.req({ uri: "/sausage", headers : { accept : "json" } })

        spy.should.have.been.calledThrice
      })
    })
    describe("negotiate.accept.method", function(){
      it("should negotiate accept-type and method", function(){
        var web = nap.web()
          , getDataSpy = sinon.spy()
          , sendDataSpy = sinon.spy()
          , getViewSpy = sinon.spy()
          , sendViewSpy = sinon.spy()

        web.resource(
          "/sausage" 
        , nap.negotiate.method(
            { 
              get : nap.negotiate.accept(
                { 
                  html : getViewSpy 
                , json : getDataSpy 
                }
              ) 
            , send : nap.negotiate.accept(
                { 
                  html : sendViewSpy 
                , json : sendDataSpy 
                }
              ) 
            }
          )
        )

        web.req({ uri: "/sausage", headers : { accept : "json" } })
        web.req({ uri: "/sausage", headers : { accept : "html" } })
        web.req({ uri: "/sausage", headers : { accept : "json" } , method : "send" })
        web.req({ uri: "/sausage", headers : { accept : "html" } , method : "send" })

        getDataSpy.should.have.been.calledOnce
        getViewSpy.should.have.been.calledOnce
        sendViewSpy.should.have.been.calledOnce
        sendViewSpy.should.have.been.calledOnce
      })
    })
  })
  describe("nap.error", function(){
    it("should respond with a 404 if no resource is found", function() {
      var web = nap.web()
        , cb = sinon.spy()

      web.req("/sausage", cb)
      cb.should.have.been.calledOnce
      cb.args[0][1].statusCode.should.equal(404)
    })
    it("should respond with a 405 if no supported method is found", function() {
      var web = nap.web()
        , cb = sinon.spy()

      web.resource(
        "/sausage" 
      , nap.negotiate.method(
          { 
            get : function(req, res) {} 
          }
        )
      )

      web.req({uri: "/sausage", method:"send"}, cb)
      console.log(cb.args[0])
      cb.should.have.been.calledOnce
      cb.args[0][1].statusCode.should.equal(405)
    })
    it("should respond with a 415 if no supported media type is found", function() {
      var web = nap.web()
        , cb = sinon.spy()

      web.resource(
        "/sausage" 
      , nap.negotiate.method(
          { 
            get : nap.negotiate.accept(
              { 
                "json" : function(req,res) { res(null, "hello") } 
              }
            )
          }
        )
      )
      web.req("/sausage", cb)
      cb.should.have.been.calledOnce
      cb.args[0][1].statusCode.should.equal(415)
    })
  })
  describe("nap.into", function(){
    var node
    beforeEach(function(){
      node = d3.select("body")
        .append("div")
        .classed("nap-tests", true)
    })
    afterEach(function(){
      node.remove()
    })
    it("should invoke the reponse body on a dom node", function() {
      var view = nap.into(node)
        , cb = sinon.spy()
        , res = {
            headers : {
              contentType : "application/x.nap.view"
            }
          , statusCode : 200
          , body : cb
          }

      view(null, res)

      cb.should.have.been.calledOnce
      cb.should.have.been.calledWith(node)
    })
    it("should do nothing for non 200 status codes", function() {
      var view = nap.into(node)
        , cb = sinon.spy()
        , res = {
            headers : {
              contentType : "application/x.nap.view"
            }
          , statusCode : 404
          , body : cb
          }

      view(null, res)

      cb.should.not.have.been.called
    })

    it("should do nothing if the content type is not a nap view", function() {
      var view = nap.into(node)
        , cb = sinon.spy()
        , res = {
            headers : {
              contentType : "application/json"
            }
          , statusCode : 200
          , body : cb
          }

      view(null, res)

      cb.should.not.have.been.calledOnce
    })

  })
})




