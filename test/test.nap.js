describe("Nap", function(){
	describe("nap.web", function(){
    it("should be able to create web instances", function(){
      var w1 = nap.web()
        , w2 = nap.web()

      expect(w1).to.include.keys("resource", "req", "view")
      expect(w2).to.include.keys("resource", "req", "view")

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

      web.resource("/foo/:val", fn)

      web.resource("/foo/:val").should.be.ok
      web.resource("/foo/:val").handler.should.be.equal(fn)

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
      fn.should.have.been.calledWith(
        { uri : "/foo/bar"
        , params : {}
        }
      )
    })
    it("should call hander in default context", function(){
      var div = document.createElement("div")
        , web = nap.web().view(div)
        , fn = sinon.spy()

      web.resource("/foo/bar", fn)
      web.req("/foo/bar")

      fn.should.have.been.calledOnce
      fn.should.have.been.calledOn(div)
    })
    it("should allow context to be overridden", function(){
      var div = document.createElement("div")
        , web = nap.web().view(div)
        , fn = sinon.spy()

      web.resource("/foo/bar", fn)

      var ul = document.createElement("ul")
        , r = web.req.bind(ul)

      r("/foo/bar")
      fn.should.have.been.calledOnce
      fn.should.have.been.calledOn(ul)
    })
    it("should should take callback for responses", function(){
      var web = nap.web()
        , cb = sinon.spy()

      web.resource("/foo/bar", function(req, res){
        res("where am i?")
      })


      web.req("/foo/bar", cb)

      cb.should.have.been.calledOnce
      cb.should.have.been.calledWith(false, {
        uri : "/foo/bar"
      , params : {}
      , body : "where am i?"
      })
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
        .resource("demo", "/my-demo/:id", function(){})

      web.uri("demo", { id : "foo" }).should.equal("/my-demo/foo")
    })  
  })
  describe("web.negotiate", function(){
    describe("bySelector", function(){
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

        var handler = nap.negotiate.bySelector(
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

        var handler = nap.negotiate.bySelector(
          ".two", t
        , ".one", o
        , "*" , t
        )

        var web = nap.web().resource("/foo", handler)

        web.req.bind(one)("/foo")

        o.should.have.been.calledOnce
        t.should.not.have.been.called
      })
    })
  })
})




