Direction
=========

things to think and do

## Protocol

Nap should standandise a protocol for interacting with resources.  This should
include:

  * message structure
  * status codes
  

## Media Types

Could devide the media types into namespaces that reflect how they behave. JSON
for example is just _data_ so is stateless, but a view has state - each view
could look different depending on how the user interacts etc (`live/view`, 
`live/object`, `data/json`, `data/html`, `data/csv`)

### live/view

Define the API requirments of a view handler

### data/json

Defines the basic api for returning stateless json objects 

## Configuration

Want to be able to configure a web of resources in data

## Composing

Want to allow URL rewriting so that a view can *own* the root node, rewriting
request to update the current state accordingly

## Hypermedia

Could hypermedia be a first-class construct within nap, and if so what would it
look like?



