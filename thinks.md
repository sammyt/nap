* seperate negotiate and handlers
* cement verbs and content-n as part of nap
* view composition
* build clean demo
* optional client/server rendering
* document the philosophy 



NAP
===

### nap.web

Routes requests to handers.  

### nap.negotiate

functions used to route requested to handlers based on some form of content negotiation

### nap.handlers

functions to create negotiate trees and invoke handers etc

## Questions

Where does the base view live
How is the negotiate tree constructed
What degree of requirejs do I want (configurable)



Want to build the handler trees based on a set of middleware like constructors

method    - specs > handler
content   - specs > handler
view      - specs > handler
module    - specs > handler

handlerBuilders
  specs > handler

what is a spec?
must have the definition data

Should I pass in next (buildXXNode)?

buildMethodNode(specs){
  var methods = findMethods(specs)

  keys(methods).forEach(function(method){
    methods[method] = buildContentNode(methods[method])
  })
  return nap.negotiate.method(methods)
}







