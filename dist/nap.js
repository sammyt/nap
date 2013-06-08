/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */

(function(root, factory) {
  "function" == typeof define && define.amd ? define([], factory) : root.nap = factory();
})(this, function() {
  var requirejs, require, define;
  (function(undef) {
    function hasProp(obj, prop) {
      return hasOwn.call(obj, prop);
    }
    function normalize(name, baseName) {
      var nameParts, nameSegment, mapValue, foundMap, foundI, foundStarMap, starI, i, j, part, baseParts = baseName && baseName.split("/"), map = config.map, starMap = map && map["*"] || {};
      if (name && "." === name.charAt(0)) if (baseName) {
        baseParts = baseParts.slice(0, baseParts.length - 1);
        name = baseParts.concat(name.split("/"));
        for (i = 0; i < name.length; i += 1) {
          part = name[i];
          if ("." === part) {
            name.splice(i, 1);
            i -= 1;
          } else if (".." === part) {
            if (1 === i && (".." === name[2] || ".." === name[0])) break;
            if (i > 0) {
              name.splice(i - 1, 2);
              i -= 2;
            }
          }
        }
        name = name.join("/");
      } else 0 === name.indexOf("./") && (name = name.substring(2));
      if ((baseParts || starMap) && map) {
        nameParts = name.split("/");
        for (i = nameParts.length; i > 0; i -= 1) {
          nameSegment = nameParts.slice(0, i).join("/");
          if (baseParts) for (j = baseParts.length; j > 0; j -= 1) {
            mapValue = map[baseParts.slice(0, j).join("/")];
            if (mapValue) {
              mapValue = mapValue[nameSegment];
              if (mapValue) {
                foundMap = mapValue;
                foundI = i;
                break;
              }
            }
          }
          if (foundMap) break;
          if (!foundStarMap && starMap && starMap[nameSegment]) {
            foundStarMap = starMap[nameSegment];
            starI = i;
          }
        }
        if (!foundMap && foundStarMap) {
          foundMap = foundStarMap;
          foundI = starI;
        }
        if (foundMap) {
          nameParts.splice(0, foundI, foundMap);
          name = nameParts.join("/");
        }
      }
      return name;
    }
    function makeRequire(relName, forceSync) {
      return function() {
        return req.apply(undef, aps.call(arguments, 0).concat([ relName, forceSync ]));
      };
    }
    function makeNormalize(relName) {
      return function(name) {
        return normalize(name, relName);
      };
    }
    function makeLoad(depName) {
      return function(value) {
        defined[depName] = value;
      };
    }
    function callDep(name) {
      if (hasProp(waiting, name)) {
        var args = waiting[name];
        delete waiting[name];
        defining[name] = !0;
        main.apply(undef, args);
      }
      if (!hasProp(defined, name) && !hasProp(defining, name)) throw new Error("No " + name);
      return defined[name];
    }
    function splitPrefix(name) {
      var prefix, index = name ? name.indexOf("!") : -1;
      if (index > -1) {
        prefix = name.substring(0, index);
        name = name.substring(index + 1, name.length);
      }
      return [ prefix, name ];
    }
    function makeConfig(name) {
      return function() {
        return config && config.config && config.config[name] || {};
      };
    }
    var main, req, makeMap, handlers, defined = {}, waiting = {}, config = {}, defining = {}, hasOwn = Object.prototype.hasOwnProperty, aps = [].slice;
    makeMap = function(name, relName) {
      var plugin, parts = splitPrefix(name), prefix = parts[0];
      name = parts[1];
      if (prefix) {
        prefix = normalize(prefix, relName);
        plugin = callDep(prefix);
      }
      if (prefix) name = plugin && plugin.normalize ? plugin.normalize(name, makeNormalize(relName)) : normalize(name, relName); else {
        name = normalize(name, relName);
        parts = splitPrefix(name);
        prefix = parts[0];
        name = parts[1];
        prefix && (plugin = callDep(prefix));
      }
      return {
        f: prefix ? prefix + "!" + name : name,
        n: name,
        pr: prefix,
        p: plugin
      };
    };
    handlers = {
      require: function(name) {
        return makeRequire(name);
      },
      exports: function(name) {
        var e = defined[name];
        return "undefined" != typeof e ? e : defined[name] = {};
      },
      module: function(name) {
        return {
          id: name,
          uri: "",
          exports: defined[name],
          config: makeConfig(name)
        };
      }
    };
    main = function(name, deps, callback, relName) {
      var cjsModule, depName, ret, map, i, usingExports, args = [];
      relName = relName || name;
      if ("function" == typeof callback) {
        deps = !deps.length && callback.length ? [ "require", "exports", "module" ] : deps;
        for (i = 0; i < deps.length; i += 1) {
          map = makeMap(deps[i], relName);
          depName = map.f;
          if ("require" === depName) args[i] = handlers.require(name); else if ("exports" === depName) {
            args[i] = handlers.exports(name);
            usingExports = !0;
          } else if ("module" === depName) cjsModule = args[i] = handlers.module(name); else if (hasProp(defined, depName) || hasProp(waiting, depName) || hasProp(defining, depName)) args[i] = callDep(depName); else {
            if (!map.p) throw new Error(name + " missing " + depName);
            map.p.load(map.n, makeRequire(relName, !0), makeLoad(depName), {});
            args[i] = defined[depName];
          }
        }
        ret = callback.apply(defined[name], args);
        name && (cjsModule && cjsModule.exports !== undef && cjsModule.exports !== defined[name] ? defined[name] = cjsModule.exports : ret === undef && usingExports || (defined[name] = ret));
      } else name && (defined[name] = callback);
    };
    requirejs = require = req = function(deps, callback, relName, forceSync, alt) {
      if ("string" == typeof deps) return handlers[deps] ? handlers[deps](callback) : callDep(makeMap(deps, callback).f);
      if (!deps.splice) {
        config = deps;
        if (callback.splice) {
          deps = callback;
          callback = relName;
          relName = null;
        } else deps = undef;
      }
      callback = callback || function() {};
      if ("function" == typeof relName) {
        relName = forceSync;
        forceSync = alt;
      }
      forceSync ? main(undef, deps, callback, relName) : setTimeout(function() {
        main(undef, deps, callback, relName);
      }, 4);
      return req;
    };
    req.config = function(cfg) {
      config = cfg;
      config.deps && req(config.deps, config.callback);
      return req;
    };
    define = function(name, deps, callback) {
      if (!deps.splice) {
        callback = deps;
        deps = [];
      }
      hasProp(defined, name) || hasProp(waiting, name) || (waiting[name] = [ name, deps, callback ]);
    };
    define.amd = {
      jQuery: !0
    };
  })();
  define("almond", function() {});
  define("rhumb", [], function() {
    function findIn(parts, tree) {
      var params = {}, find = function(remaining, node) {
        var part = remaining.shift();
        if (!part) return node.leaf || !1;
        if (node.fixed && part in node.fixed) return find(remaining, node.fixed[part]);
        if (node.partial) {
          var tests = node.partial.tests, found = tests.some(function(partial) {
            if (partial.ptn.test(part)) {
              var match = part.match(partial.ptn);
              partial.vars.forEach(function(d, i) {
                params[d] = match[i + 1];
              });
              node = partial;
              return !0;
            }
          });
          if (found) return find(remaining, node);
        }
        if (node.var) {
          params[node.var.name] = part;
          return find(remaining, node.var);
        }
        return !1;
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
        if (isArr(part)) {
          node.leaf = fn;
          updateTree(part, node, fn);
        } else if (part) {
          if ("fixed" == part.type) {
            node.fixed || (node.fixed = {});
            peek = node.fixed[part.input] || (node.fixed[part.input] = {});
          } else if ("var" == part.type) {
            if (node.var) throw new Error("Ambiguity");
            peek = node.var = {};
            peek.name = part.input;
          } else if (part.type = "partial") {
            if (node.partial && node.partial.names[part.name]) throw new Error("Ambiguity");
            node.partial || (node.partial = {
              names: {},
              tests: []
            });
            peek = {};
            peek.ptn = part.input;
            peek.vars = part.vars;
            node.partial.names[part.name] = peek;
            node.partial.tests.push(peek);
          }
          more ? updateTree(parts, peek, fn) : peek.leaf = fn;
        }
      }
      var router = {}, tree = {};
      router.add = function(ptn, callback) {
        updateTree(parse(ptn), tree, callback);
      };
      router.match = function(path) {
        var parts = path.split("/").filter(falsy), match = findIn(parts, tree);
        return match ? match.fn.apply(match.fn, [ match.params ]) : void 0;
      };
      return router;
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
        for (var match = part.match(partial), ptn = "", len = part.length, i = 0; len > i && match; ) {
          i += match[0].length;
          match[1] && (ptn += match[1]);
          ptn += "([\\w-]+)";
          match[3] && (ptn += match[3]);
          match = part.substr(i).match(partial);
        }
        var vars = [], name = part.replace(/{([\w-]+)}/g, function(p, d) {
          vars.push(d);
          return "{var}";
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
          curr = ptn[i];
          switch (curr) {
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
    rhumb.create = create;
    rhumb._parse = parse;
    rhumb._findInTree = findIn;
    return rhumb;
  });
  define("nap", [ "require", "rhumb" ], function(require) {
    function isFn(inst) {
      return "function" == typeof inst;
    }
    function isStr(inst) {
      return "string" == typeof inst;
    }
    function noop() {}
    function webFromConfig(config) {
      var names = Object.keys(config), web = nap.web();
      names.forEach(function(name) {
        var resource = config[name], specs = resource.handlers;
        web.resource(name, resource.route, negotiation(specs));
      });
      web.config = config;
      return web;
    }
    function negotiation(specs) {
      var handlers = [];
      specs.forEach(function(spec) {
        handlers.push(module(spec.source));
      });
      specs.forEach(function(spec, i) {
        "app/view" == spec.responds && (handlers[i] = nap.handlers.view(handlers[i]));
      });
      specs.forEach(function(spec, i) {
        var bycontent = {};
        bycontent[spec.responds] = handlers[i];
        handlers[i] = nap.negotiate.content(bycontent);
      });
      var methods = {};
      specs.forEach(function(spec, i) {
        [].concat(spec.method).forEach(function(method) {
          methods[method] || (methods[method] = []);
          methods[method].push(handlers[i]);
        });
      });
      Object.keys(methods).forEach(function(method) {
        methods[method] = nap.negotiate.ordered.apply(this, methods[method]);
      });
      return nap.negotiate.method(methods);
    }
    function module(id) {
      return function(req, res) {
        var that = this, r = req.locals.require || require;
        r([ id ], function(mod) {
          nap.handlers.invoke(that, mod, req, res);
        });
      };
    }
    function byOrdered() {
      var fns = [].slice.apply(arguments, [ 0 ]);
      return function(req, res) {
        function next(fns) {
          var fn = fns.shift();
          fn ? invoke(scope, fn, req, function(err, data) {
            err ? next(fns) : res(err, data);
          }) : res("All handlers failed");
        }
        var scope = this;
        fns.length ? next([].concat(fns)) : res("No handers specified");
      };
    }
    function byContent(pair) {
      return function(req, res) {
        var fn = pair[req.headers.accept];
        fn && invoke(this, fn, req, res);
      };
    }
    function bySelector() {
      function is() {
        return !0;
      }
      var options = [].slice.apply(arguments, [ 0 ]).reduce(function(curr, next) {
        isStr(next) ? curr.push({
          selector: next
        }) : curr[curr.length - 1].fn = next;
        return curr;
      }, []);
      return function(req, res) {
        var node = this instanceof nap_window.HTMLElement ? this : req.web.view(), called = !1;
        called = options.some(function(option) {
          if (is(node, option.selector)) {
            invoke(node, option.fn, req, res);
            return !0;
          }
        });
        called || res("No matches found");
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
        req.method != method ? res("Method Not Supported") : invoke(this, fn, req, res);
      };
    }
    function repliesView(fn) {
      return function(req, res) {
        var node = this instanceof nap_window.HTMLElement ? this : req.locals.baseView;
        invoke(node, fn, req, res);
      };
    }
    function invoke(scope, fn, req, cb) {
      var sync = !1, args = [ req ];
      fn.length > 1 ? args.push(isFn(cb) ? cb : noop) : sync = !0;
      fn.apply(scope, args);
      sync && isFn(cb) && cb();
    }
    function newWeb() {
      var web = {}, resources = {}, routes = rhumb.create();
      web.resource = function(name, ptn, handler) {
        if (1 == arguments.length) return resources[name];
        if (2 == arguments.length) {
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
        isStr(path) && (req = {
          uri: path,
          method: "get"
        });
        req.web = web;
        req.method || (req.method = "get");
        "get" == req.method && delete req.body;
        var match = routes.match(req.uri);
        if (match) {
          req.params = match.params;
          req.locals = req.locals || {};
          invoke(this, match.fn, req, cb);
          return web;
        }
        cb(req.uri + " not found");
      };
      return web;
    }
    var nap = {}, rhumb = require("rhumb");
    nap.web = newWeb;
    nap.web.fromConfig = webFromConfig;
    nap.negotiate = {
      selector: bySelector,
      ordered: byOrdered,
      method: byMethod,
      content: byContent
    };
    nap.handlers = {
      invoke: invoke,
      view: repliesView
    };
    return nap;
  });
  return require("nap");
});