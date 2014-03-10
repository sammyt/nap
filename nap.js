nap = function environment(nap_window) {
  function noop() {}
  function into(node) {
    return function(err, res) {
      200 == res.statusCode && (res.headers.contentType && "application/x.nap.view" != res.headers.contentType || isFn(res.body) && node && (node.dispatchEvent && node.dispatchEvent(new Event("update")), 
      res.body(node)));
    };
  }
  function is(n, s) {
    return matchesSelector.call(n, s);
  }
  function isFn(inst) {
    return "function" == typeof inst;
  }
  function isStr(inst) {
    return "string" == typeof inst;
  }
  function toArray(args) {
    return [].slice.call(args);
  }
  function ok(data) {
    return {
      body: data,
      statusCode: 200,
      headers: {}
    };
  }
  function error(code) {
    return {
      statusCode: code,
      headers: {}
    };
  }
  function dispatcher(wants, error) {
    return function(map) {
      var args = [];
      return Object.keys(map).forEach(function(key) {
        args.push(wants(key, map[key]));
      }), args.push(error), dispatch.apply(null, args);
    };
  }
  function uses(comparator, respond) {
    return function(key, fn) {
      return function(req, res) {
        return comparator(req, key) ? (fn.call(null, req, respond(key, res)), !0) : void 0;
      };
    };
  }
  function dispatch() {
    var fns = toArray(arguments);
    return function() {
      var args = toArray(arguments);
      return fns.some(function(fn) {
        return fn.apply(null, args);
      });
    };
  }
  function checkMethod(req, method) {
    return req.method == method;
  }
  function setMethod(type, res) {
    return function(err, data) {
      data.method = type, res(err, data);
    };
  }
  function checkAcceptType(req, type) {
    return req.headers.accept == type;
  }
  function setContentType(type, res) {
    return function(err, data) {
      data.headers.contentType = type, res(err, data);
    };
  }
  function errorsWith(code) {
    return function(req, res) {
      return res(null, error(code)), !0;
    };
  }
  function bySelector() {
    var options = toArray(arguments).reduce(function(curr, next) {
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
      var req = isStr(path) ? {
        uri: path
      } : path, cb = cb || noop;
      req.web = web, req.method || (req.method = "get"), "get" == req.method && delete req.body, 
      req.headers || (req.headers = {}), req.headers.accept || (req.headers.accept = "application/x.nap.view");
      var match = routes.match(req.uri);
      return match ? (req.params = match.params, match.fn.call(null, req, cb), web) : void cb(null, error(404));
    }, web.uri = function(ptn, params) {
      var meta = resources[ptn];
      meta && (ptn = meta.ptn);
      var parts = rhumb._parse(ptn);
      return parts.reduce(function(uri, part) {
        return "var" == part.type ? [ uri, params[part.input] ].join("/") : [ uri, part.input ].join("/");
      }, "");
    }, web;
  }
  var nap = {
    environment: environment
  }, nap_window = nap_window || window, nap_document = nap_window.document;
  nap.web = newWeb, nap.is = is, nap.into = into, nap.negotiate = {
    selector: bySelector,
    method: dispatcher(uses(checkMethod, setMethod), errorsWith(405)),
    accept: dispatcher(uses(checkAcceptType, setContentType), errorsWith(415))
  }, nap.responses = {
    ok: ok,
    error: error
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