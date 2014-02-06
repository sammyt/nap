nap = function environment(nap_window) {
  function noop() {}
  function is(n, s) {
    return matchesSelector.call(n, s);
  }
  function isStr(inst) {
    return "string" == typeof inst;
  }
  function byOrdered(fns, error) {
    return function(req, res, response) {
      function next(fns) {
        var fn = fns.shift();
        return fn ? void invoke(scope, fn, req, function(err, data) {
          err ? next(fns) : res(err, data);
        }, response) : (!response.status && (response.status = error), void res(error || "All handlers failed"));
      }
      var scope = this;
      return fns.length ? void next([].concat(fns)) : (!response.status && (response.status = error), 
      void res(error || "No handers specified"));
    };
  }
  function bySelector() {
    var options = [].slice.apply(arguments, [ 0 ]).reduce(function(curr, next) {
      return isStr(next) ? curr.push({
        selector: next
      }) : curr[curr.length - 1].fn = next, curr;
    }, []);
    return function(res) {
      var node = this, called = !1;
      called = options.some(function(option) {
        return is(node, option.selector) ? (option.fn.call(node, res), !0) : void 0;
      }), called || res("No matches found");
    };
  }
  function methodGetter(req) {
    return req.method;
  }
  function acceptTypeGetter(req) {
    return req.headers.accept;
  }
  function acceptTypeSetter(res, value) {
    res.headers["Content-type"] = value;
  }
  function byComparator(getter, setter, error) {
    return function(map) {
      var order = Object.keys(map).map(function(key) {
        return handleKey(key, map[key], getter, setter);
      });
      return function(req, res, response) {
        var fn = byOrdered.call(null, order, error);
        invoke(this, fn, req, res, response);
      };
    };
  }
  function handleKey(key, fn, getField, setField) {
    return function(req, res, response) {
      return getField(req) == key ? (setField(response, key), void invoke(this, fn, req, res, response)) : void res("No Match");
    };
  }
  function repliesView(fn) {
    return function(req, res, response) {
      var node = this instanceof nap_window.HTMLElement ? this : req.web.view();
      invoke(node, fn, req, res, response);
    };
  }
  function invoke(scope, fn, req, cb, response) {
    fn.call(scope, req, cb, response);
  }
  function respond(cb, res) {
    return function(err, data) {
      res.body = data, !res.status && (res.status = err || "200 OK"), cb(res);
    };
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
      var response, req = path, cb = cb || noop;
      isStr(path) && (req = {
        uri: path,
        method: "get",
        headers: {
          accept: "application/x.nap.view"
        }
      }), req.web = web, req.method || (req.method = "get"), "get" == req.method && delete req.body, 
      req.headers || (req.headers = {}), req.headers.accept || (req.headers.accept = "application/x.nap.view");
      var match = routes.match(req.uri);
      return match ? (req.params = match.params, response = {
        uri: req.uri,
        method: req.method,
        status: null,
        headers: {
          "Content-type": "application/x.nap.view"
        },
        body: null,
        params: req.params
      }, invoke(this, match.fn, req, respond(cb, response), response), web) : void cb(req.uri + " not found");
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
    method: byComparator(methodGetter, noop, "405 Method Not Allowed"),
    accept: byComparator(acceptTypeGetter, acceptTypeSetter, "415 Unsupported Media Type"),
    invoke: invoke
  }, nap.replies = {
    view: repliesView
  };
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