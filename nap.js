nap = function environment(nap_window) {
  function noop() {}
  function is(n, s) {
    return matchesSelector.call(n, s);
  }
  function isFn(inst) {
    return "function" == typeof inst;
  }
  function isStr(inst) {
    return "string" == typeof inst;
  }
  function byOrdered() {
    var fns = [].slice.apply(arguments, [ 0 ]);
    return function(req, res) {
      function next(fns) {
        var fn = fns.shift();
        return fn ? (invoke(scope, fn, req, function(err, data) {
          err ? next(fns) : res(err, data);
        }), void 0) : (res("All handlers failed"), void 0);
      }
      var scope = this;
      return fns.length ? (next([].concat(fns)), void 0) : (res("No handers specified"), 
      void 0);
    };
  }
  function bySelector() {
    var options = [].slice.apply(arguments, [ 0 ]).reduce(function(curr, next) {
      return isStr(next) ? curr.push({
        selector: next
      }) : curr[curr.length - 1].fn = next, curr;
    }, []);
    return function(req, res) {
      var node = this instanceof nap_window.HTMLElement ? this : req.web.view(), called = !1;
      called = options.some(function(option) {
        return is(node, option.selector) ? (invoke(node, option.fn, req, res), !0) : void 0;
      }), called || res("No matches found");
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
      return req.method == method ? (invoke(this, fn, req, res), void 0) : (res("Method Not Supported"), 
      void 0);
    };
  }
  function repliesView(fn) {
    return function(req, res) {
      var node = this instanceof nap_window.HTMLElement ? this : req.web.view();
      invoke(node, fn, req, res);
    };
  }
  function invoke(scope, fn, req, cb) {
    var sync = !1, args = [ req ];
    fn.length > 1 ? args.push(isFn(cb) ? cb : noop) : sync = !0, fn.apply(scope, args), 
    sync && isFn(cb) && cb();
  }
  function newWeb() {
    var web = {}, view = nap_document.documentElement, resources = {}, routes = rhumb.create();
    return web.resource = function(name, ptn, handler) {
      return 1 == arguments.length ? resources[name] : (2 == arguments.length && (handler = ptn, 
      ptn = name), resources[name] = {
        name: name,
        ptn: ptn,
        handler: handler
      }, routes.add(ptn, function(params) {
        return {
          fn: handler,
          params: params
        };
      }), web);
    }, web.req = function(path, cb) {
      var req = path;
      isStr(path) && (req = {
        uri: path,
        method: "get"
      }), req.web = web, req.method || (req.method = "get"), "get" == req.method && delete req.body;
      var match = routes.match(req.uri);
      return match ? (req.params = match.params, invoke(this, match.fn, req, cb), web) : (cb(req.uri + " not found"), 
      void 0);
    }, web.view = function(val) {
      return arguments.length ? (view = val, web) : view;
    }, web.uri = function(name, params) {
      var meta = resources[name];
      if (!meta) throw new Error(name + " not found");
      var parts = rhumb._parse(meta.ptn);
      return parts.reduce(function(uri, part) {
        return "var" == part.type ? [ uri, params[part.input] ].join("/") : [ uri, part.input ].join("/");
      }, "");
    }, web;
  }
  var nap = {
    environment: environment
  }, nap_window = nap_window || window, nap_document = nap_window.document;
  nap.web = newWeb, nap.negotiate = {
    selector: bySelector,
    ordered: byOrdered,
    method: byMethod,
    invoke: invoke
  }, nap.replies = {
    view: repliesView
  };
  var root = nap_document.documentElement, matchesSelector = root.matchesSelector || root.webkitMatchesSelector || root.mozMatchesSelector || root.msMatchesSelector || root.oMatchesSelector;
  return nap;
}();