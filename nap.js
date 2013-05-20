nap = function environment(nap_window) {
  var nap = {
    environment: environment
  }, nap_window = nap_window || window, nap_document = nap_window.document;
  nap.web = newWeb;
  nap.negotiate = {
    selector: bySelector,
    ordered: byOrdered,
    method: byMethod,
    invoke: invoke
  };
  nap.replies = {
    view: repliesView
  };
  function noop() {}
  var root = nap_document.documentElement, matchesSelector = root.matchesSelector || root.webkitMatchesSelector || root.mozMatchesSelector || root.msMatchesSelector || root.oMatchesSelector;
  function is(n, s) {
    return matchesSelector.call(n, s);
  }
  function isFn(inst) {
    return typeof inst === "function";
  }
  function isStr(inst) {
    return typeof inst === "string";
  }
  function byOrdered() {
    var fns = [].slice.apply(arguments, [ 0 ]);
    return function(req, res) {
      var scope = this;
      if (!fns.length) {
        res("No handers specified");
        return;
      }
      next([].concat(fns));
      function next(fns) {
        var fn = fns.shift();
        if (!fn) {
          res("All handlers failed");
          return;
        }
        invoke(scope, fn, req, function(err, data) {
          if (err) {
            next(fns);
          } else {
            res(err, data);
          }
        });
      }
    };
  }
  function bySelector() {
    var options = [].slice.apply(arguments, [ 0 ]).reduce(function(curr, next) {
      if (isStr(next)) curr.push({
        selector: next
      }); else curr[curr.length - 1].fn = next;
      return curr;
    }, []);
    return function(req, res) {
      var node = this instanceof nap_document.documentElement.constructor ? this : req.web.view(), called = false;
      called = options.some(function(option) {
        if (is(node, option.selector)) {
          invoke(node, option.fn, req, res);
          return true;
        }
      });
      if (!called) {
        res("No matches found");
      }
    };
  }
  function byMethod(map) {
    var order = Object.keys(map).map(function(method) {
      return handleMethod(method, map[method]);
    });
    return function(req, res) {
      var fn = byOrdered.apply(null, order);
      invoke(this, fn, req, res);
    };
  }
  function handleMethod(method, fn) {
    return function(req, res) {
      if (req.method == method) {
        invoke(this, fn, req, res);
        return;
      }
      res("Method Not Supported");
    };
  }
  function repliesView(fn) {
    return function(req, res) {
      var node = this instanceof nap_document.documentElement.constructor ? this : req.web.view();
      invoke(node, fn, req, res);
    };
  }
  function invoke(scope, fn, req, cb) {
    var sync = false, args = [ req ];
    if (fn.length > 1) {
      args.push(isFn(cb) ? cb : noop);
    } else {
      sync = true;
    }
    fn.apply(scope, args);
    if (sync && isFn(cb)) {
      cb();
    }
  }
  function newWeb() {
    var web = {}, view = nap_document.documentElement, resources = {}, routes = rhumb.create();
    web.resource = function(name, ptn, handler) {
      if (arguments.length == 1) return resources[name];
      if (arguments.length == 2) {
        handler = ptn;
        ptn = name;
      }
      resources[name] = {
        name: name,
        ptn: ptn,
        handler: handler
      };
      routes.add(ptn, function(params) {
        return {
          fn: handler,
          params: params
        };
      });
      return web;
    };
    web.req = function(path, cb) {
      var req = path;
      if (isStr(path)) {
        req = {
          uri: path,
          method: "get"
        };
      }
      req.web = web;
      req.method || (req.method = "get");
      req.method == "get" && delete req["body"];
      var match = routes.match(req.uri);
      if (!match) {
        cb(req.uri + " not found");
        return;
      }
      req.params = match.params;
      invoke(this, match.fn, req, cb);
      return web;
    };
    web.view = function(val) {
      if (!arguments.length) return view;
      view = val;
      return web;
    };
    web.uri = function(name, params) {
      var meta = resources[name];
      if (!meta) throw new Error(name + " not found");
      var parts = rhumb._parse(meta.ptn);
      return parts.reduce(function(uri, part) {
        if (part.type == "var") {
          return [ uri, params[part.input] ].join("/");
        }
        return [ uri, part.input ].join("/");
      }, "");
    };
    return web;
  }
  return nap;
}();

(function() {
  function t(t, r) {
    var n = {}, a = function(t, r) {
      var e = t.shift();
      if (!e) return r.leaf || !1;
      if (r.fixed && e in r.fixed) return a(t, r.fixed[e]);
      if (r.partial) {
        var i = r.partial.tests, f = i.some(function(t) {
          if (t.ptn.test(e)) {
            var a = e.match(t.ptn);
            return t.vars.forEach(function(t, r) {
              n[t] = a[r + 1];
            }), r = t, !0;
          }
        });
        if (f) return a(t, r);
      }
      return r.var ? (n[r.var.name] = e, a(t, r.var)) : !1;
    }, e = a(t, r, n);
    return e ? {
      fn: e,
      params: n
    } : !1;
  }
  function r() {
    var r = {}, e = {}, i = function(t, r, n) {
      var a, e = t.shift(), f = !!t.length;
      if (e) if ("fixed" == e.type) r.fixed || (r.fixed = {}), a = r.fixed[e.input] || (r.fixed[e.input] = {}), 
      f ? i(t, a, n) : a.leaf = n; else if ("var" == e.type) {
        if (r.var) throw Error("Ambiguity");
        a = r.var = {}, a.name = e.input, f ? i(t, a, n) : a.leaf = n;
      } else if (e.type = "partial") {
        if (r.partial && r.partial.names[e.name]) throw Error("Ambiguity");
        r.partial || (r.partial = {
          names: {},
          tests: []
        });
        var a = {};
        a.ptn = e.input, a.vars = e.vars, r.partial.names[e.name] = a, r.partial.tests.push(a), 
        f ? i(t, a, n) : a.leaf = n;
      }
    };
    return r.add = function(t, r) {
      i(a(t), e, r);
    }, r.match = function(r) {
      var a = r.split("/").filter(n), i = t(a, e);
      return i ? i.fn.apply(i.fn, [ i.params ]) : void 0;
    }, r;
  }
  function n(t) {
    return !!t;
  }
  function a(t) {
    function r(t) {
      var r = t.match(u);
      return {
        type: "var",
        input: r[1]
      };
    }
    function a(t) {
      return {
        type: "fixed",
        input: t
      };
    }
    function e(t) {
      for (var r = t.match(p), n = "", a = t.length, e = 0; a > e && r; ) e += r[0].length, 
      r[1] && (n += r[1]), n += "([\\w-]+)", r[3] && (n += r[3]), r = t.substr(e).match(p);
      var i = [], f = t.replace(/{([\w-]+)}/g, function(t, r) {
        return i.push(r), "{var}";
      });
      return {
        type: "partial",
        input: RegExp(n),
        name: f,
        vars: i
      };
    }
    function i(t) {
      return t.split("/").filter(n).map(function(t) {
        return u.test(t) ? r(t) : p.test(t) ? e(t) : a(t);
      });
    }
    function f(t) {
      for (var r, n = "", a = [], e = 0, u = t.length, p = !0; p && u > e; ) {
        switch (r = t[e]) {
         case ")":
         case "(":
          p = !1;
          break;

         default:
          n += r;
        }
        e++;
      }
      if (!p) {
        var s = f(t.substr(e + 1));
        s.length && a.push(s);
      }
      return i(n).concat(a);
    }
    var u = /^{(\w+)}$/, p = /([\w'-]+)?{([\w-]+)}([\w'-]+)?/;
    return "/" == t.trim() ? [ {
      type: "fixed",
      input: ""
    } ] : -1 == t.indexOf("(") ? i(t) : f(t);
  }
  rhumb = r(), rhumb.create = r, rhumb._parse = a, rhumb._findInTree = t;
})();