({
  name: "nap"
, baseUrl: "src"
, out: "dist/nap.js"
, optimize : "uglify2"
, paths: {
    "rhumb" : "../components/rhumb/dist/rhumb"
  , "almond": "../components/almond/almond"
  }
, include: ["almond"]
, wrap : {
    startFile : "src/start.js"
  , endFile : "src/end.js"
  }
, uglify2: {
    output: {
      beautify: true
    , indent_level : 2
    }
  , compress: {
      sequences: false
    , global_defs: { DEBUG: false }
    }
  , warnings: true
  , mangle: false
},
})