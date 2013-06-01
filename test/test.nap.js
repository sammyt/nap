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
    it("should allow scope to be overridden", function(){
      var div = document.createElement("div")
        , web = nap.web()
        , spy = sinon.spy()
        , fn = nap.replies.view(spy, div)

      web.resource("/foo/bar", fn)

      var ul = document.createElement("ul")
        , r = web.req.bind(ul)

      r("/foo/bar")
      spy.should.have.been.calledOnce
      spy.should.have.been.calledOn(ul)
    })
    it("should should take callback for responses", function(){
      var web = nap.web()
        , cb = sinon.spy()

      web.resource("/foo/bar", function(req, res){
        res(false, "where am i?")
      })


      web.req("/foo/bar", cb)

      cb.should.have.been.calledOnce
      cb.should.have.been.calledWith(false, "where am i?")
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
  })
  /*describe("web.uri", function(){
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
  })*/
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

        var handler = nap.negotiate.selector(
          ".one", o
        , ".two" , t
        )

        var web = nap.web().resource("/foo", handler)

        web.req.bind(one)("/foo")

        o.should.have.been.calledOnce
        t.should.not.have.been.called
      })
      it("should assess handlers in order (top to bottom)", function(){
        var one = node.append("span").classed("one", true).node()
          , o = sinon.spy()
          , t = sinon.spy()

        var handler = nap.negotiate.selector(
          ".two", t
        , ".one", o
        , "*" , t
        )

        var web = nap.web().resource("/foo", handler)

        web.req.bind(one)("/foo")

        o.should.have.been.calledOnce
        t.should.not.have.been.called
      })
      it("should fail when no selector matches", function(){
        var o = sinon.spy()
          , t = sinon.spy()
          , cb = sinon.spy()
          , node = window.document.documentElement

        var handler = nap.negotiate.selector(
          ".two", t
        , ".one", o
        )

        var web = nap.web().resource("/foo", handler)

        web.req.bind(node)("/foo", cb)

        o.should.not.have.been.called
        t.should.not.have.been.called

        cb.should.have.been.calledOnce
        cb.should.have.been.calledWith("No matches found")
      })
    })
    describe("ordered", function(){
      it("should try handlers in order they are added", function(){
        var calls = []

        nap.web().resource(
          "/nothing"
        , nap.negotiate.ordered(
            function(req, res){ calls.push("one"), res(true) }
          , function(req, res){ calls.push("two"), res(true) }  
          )
        )
        .req("/nothing")

        calls.should.eql(["one", "two"])
      })
      it("should fail when all handers fail", function(){
        var calls = []
          , cb = sinon.spy()

        nap.web().resource(
          "/nothing"
        , nap.negotiate.ordered(
            function(req, res){ calls.push("one"), res(true) }
          , function(req, res){ calls.push("two"), res(true) }  
          )
        )
        .req("/nothing", cb)

        calls.should.eql(["one", "two"])
        cb.should.have.been.calledOnce
        cb.should.have.been.calledWith("All handlers failed")
      })
      it("should only call handers until one succeeds", function(){
        var calls = []
          , cb = sinon.spy()

        nap.web().resource(
          "/nothing"
        , nap.negotiate.ordered(
            function(req, res){ calls.push("one"),   res(true) }
          , function(req, res){ calls.push("two"),   res(true) }
          , function(req, res){ calls.push("three"), res(false) }  
          , function(req, res){ calls.push("four"),  res(false) }  
          )
        )
        .req("/nothing", cb)

        calls.should.eql(["one", "two", "three"])
        cb.should.have.been.calledOnce
        cb.should.have.been.calledWith(false)
      })
    })
    describe("method", function(){
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
  })
  describe("web.replies", function(){
    it("should invoke on web.view when no node specified", function(){
      var web = nap.web()
        , fn = sinon.spy()
        , div = document.createElement("div")

      web.resource("/foo/bar", nap.replies.view(fn, div))

      web.req("/foo/bar")

      fn.should.have.been.calledOnce
      fn.should.have.been.calledOn(div)
    })
  })
})




