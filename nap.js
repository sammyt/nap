nap = function environment(nap_window) {
  function into(node) {
    return function(err, res) {
      if (200 == res.statusCode && "application/x.nap.view" == res.headers.contentType) {
        var view = res.body;
        view(node);
      }
    };
  }
  function noop() {}
  function is(n, s) {
    return matchesSelector.call(n, s);
  }
  function isStr(inst) {
    return "string" == typeof inst;
  }
  function bySelector() {
    var options = [].slice.apply(arguments, [ 0 ]).reduce(function(curr, next) {
      return isStr(next) ? curr.push({
        selector: next
      }) : curr[curr.length - 1].fn = next, curr;
    }, []);
    return function(node, cb) {
      var called = !1, cb = cb || noop;
      called = options.some(function(option) {
        return is(node, option.selector) ? (option.fn.call(null, node), cb(null, option.selector), 
        !0) : void 0;
      }), called || cb("No matching selector");
    };
  }
  function byOrdered(fns, setErrorStatus) {
    return function(req, res) {
      function next(fns) {
        var fn = fns.shift();
        return fn ? void invoke(response, fn, req, function(err, data) {
          err ? next(fns) : res(err, data);
        }) : (setErrorStatus(response), void res("All handlers failed"));
      }
      var response = this;
      return fns.length ? void next([].concat(fns)) : (setErrorStatus(response), void res("No handers specified"));
    };
  }
  function matchMethod(req, method) {
    return req.method == method;
  }
  function matchAcceptType(req, acceptType) {
    return req.headers.accept == acceptType;
  }
  function setContentType(response, value) {
    response.headers.contentType = value;
  }
  function setStatusCode(statusCode) {
    return function(response) {
      !response.statusCode && (response.statusCode = statusCode);
    };
  }
  function byNegotiation(comparator, action, error) {
    return function(map) {
      function handler(req, res) {
        var fn = byOrdered.call(null, order, error);
        invoke(this, fn, req, res);
      }
      var order = Object.keys(map).map(function(key) {
        return handleKey(key, map[key], comparator, action);
      });
      return handler.scoped = !0, handler;
    };
  }
  function handleKey(key, fn, compare, update) {
    return function(req, res) {
      if (compare(req, key)) {
        var response = this;
        return update(response, key), void invokeHandler(response, fn, req, res);
      }
      res("No Match");
    };
  }
  function invokeHandler(scope, fn, req, cb) {
    scope = fn.scoped ? scope : null, invoke(scope, fn, req, cb);
  }
  function invoke(scope, fn, req, cb) {
    fn.call(scope, req, cb);
  }
  function response(cb, res) {
    return function(err, data) {
      res.body = data, !res.statusCode && (res.statusCode = 200), cb(err, res);
    };
  }
  function newWeb() {
    var web = {}, resources = (nap_document.documentElement, {}), routes = rhumb.create();
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
      var res, req = path, cb = cb || noop;
      isStr(path) && (req = {
        uri: path,
        method: "get",
        headers: {
          accept: "application/x.nap.view"
        }
      }), req.web = web, req.method || (req.method = "get"), "get" == req.method && delete req.body, 
      req.headers || (req.headers = {}), req.headers.accept || (req.headers.accept = "application/x.nap.view"), 
      res = {
        method: req.method,
        headers: {}
      };
      var match = routes.match(req.uri);
      return match ? (req.params = res.params = match.params, invokeHandler(res, match.fn, req, response(cb, res)), 
      web) : (res.statusCode = 404, void cb(null, res));
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
    method: byNegotiation(matchMethod, noop, setStatusCode(405)),
    accept: byNegotiation(matchAcceptType, setContentType, setStatusCode(415))
  }, nap.into = into;
  var root = nap_document.documentElement, matchesSelector = root.matchesSelector || root.webkitMatchesSelector || root.mozMatchesSelector || root.msMatchesSelector || root.oMatchesSelector;
  return nap;
}(), function(root) {
  function findIn(parts, tree) {
    var params = {}, find = function(remaining, node) {
      var part = remaining.shift();
      if (!part) return node.leaf || !1;
      if (node.fixed && part in node.fixed) return find(remaining, node.fixed[part]);
      if (node.partial) {
        var tests = node.partial.tests, found = tests.some(function(partial) {
          if (partial.ptn.test(part)) {
            var match = part.match(partial.ptn);
            return partial.vars.forEach(function(d, i) {
              params[d] = match[i + 1];
            }), node = partial, !0;
          }
        });
        if (found) return find(remaining, node);
      }
      return node.var ? (params[node.var.name] = part, find(remaining, node.var)) : !1;
    }, found = find(parts, tree, params);
    return found ? {
      fn: found,
      params: params
    } : !1;
  }
  function isArr(inst) {
    return inst instanceof Array;
  }
  function create() {
    function updateTree(parts, node, fn) {
      var peek, part = parts.shift(), more = !!parts.length;
      if (isArr(part)) return node.leaf = fn, void updateTree(part, node, fn);
      if (part) {
        if ("fixed" == part.type) node.fixed || (node.fixed = {}), peek = node.fixed[part.input] || (node.fixed[part.input] = {}); else if ("var" == part.type) {
          if (node.var) throw new Error("Ambiguity");
          peek = node.var = {}, peek.name = part.input;
        } else if (part.type = "partial") {
          if (node.partial && node.partial.names[part.name]) throw new Error("Ambiguity");
          node.partial || (node.partial = {
            names: {},
            tests: []
          }), peek = {}, peek.ptn = part.input, peek.vars = part.vars, node.partial.names[part.name] = peek, 
          node.partial.tests.push(peek);
        }
        more ? updateTree(parts, peek, fn) : peek.leaf = fn;
      }
    }
    var router = {}, tree = {};
    return router.add = function(ptn, callback) {
      updateTree(parse(ptn), tree, callback);
    }, router.match = function(path) {
      var parts = path.split("/").filter(falsy), match = findIn(parts, tree);
      return match ? match.fn.apply(match.fn, [ match.params ]) : void 0;
    }, router;
  }
  function falsy(d) {
    return !!d;
  }
  function parse(ptn) {
    function parseVar(part) {
      var match = part.match(variable);
      return {
        type: "var",
        input: match[1]
      };
    }
    function parseFixed(part) {
      return {
        type: "fixed",
        input: part
      };
    }
    function parsePartial(part) {
      for (var match = part.match(partial), ptn = "", len = part.length, i = 0; len > i && match; ) i += match[0].length, 
      match[1] && (ptn += match[1]), ptn += "([\\w-]+)", match[3] && (ptn += match[3]), 
      match = part.substr(i).match(partial);
      var vars = [], name = part.replace(/{([\w-]+)}/g, function(p, d) {
        return vars.push(d), "{var}";
      });
      return {
        type: "partial",
        input: new RegExp(ptn),
        name: name,
        vars: vars
      };
    }
    function parsePtn(ptn) {
      return ptn.split("/").filter(falsy).map(function(d) {
        return variable.test(d) ? parseVar(d) : partial.test(d) ? parsePartial(d) : parseFixed(d);
      });
    }
    function parseOptional(ptn) {
      for (var curr, out = "", list = [], i = 0, len = ptn.length, onePart = !0; onePart && len > i; ) {
        switch (curr = ptn[i]) {
         case ")":
         case "(":
          onePart = !1;
          break;

         default:
          out += curr;
        }
        i++;
      }
      if (!onePart) {
        var next = parseOptional(ptn.substr(i + 1));
        next.length && list.push(next);
      }
      return parsePtn(out).concat(list);
    }
    var variable = /^{(\w+)}$/, partial = /([\w'-]+)?{([\w-]+)}([\w'-]+)?/;
    return "/" == ptn.trim() ? [ {
      type: "fixed",
      input: ""
    } ] : -1 == ptn.indexOf("(") ? parsePtn(ptn) : parseOptional(ptn);
  }
  var rhumb = create();
  return rhumb.create = create, rhumb._parse = parse, rhumb._findInTree = findIn, 
  root.rhumb = rhumb, "function" == typeof define && define.amd && define("rhumb", [], function() {
    return rhumb;
  }), rhumb;
}(window);