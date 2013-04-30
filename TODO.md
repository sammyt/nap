Direction
---------

things to think and do

### Clarify the protocol

Nap should standandise a protocol for interacting with resources.  This should
include:

* allowed verbs and their semantics
* message structure and api
* status codes
* return type & api of views
* lifecycle of views handlers

### Provide a means of discovering resources

Would like to be able to query a nap instance to discover what resources it has

### Design URL rewriting rules

Want to allow URL rewriting so that a view can *own* the root node, rewriting
request to update the current state accordingly

### Refine position on hypermedia

Could hypermedia be a first-class construct within nap, and if so what would it
look like?

### Refine position on modules

If nap has no opinion on it, there should be an easy way to work with the 
common choices such as amd.


