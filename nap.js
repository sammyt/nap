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
}(), rhumb = function() {
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
      if (isArr(part)) return node.leaf = fn, updateTree(part, node, fn), void 0;
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
  rhumb;
}();