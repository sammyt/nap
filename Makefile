PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash

build: node_modules src/nap.js
	echo "--> Building project ..."
	mkdir -p lib
	browserify src/nap.js --standalone nap -o lib/nap.js

test: build
	echo "--> Running tests ..."
	tape $(wildcard test/*.js) $(wildcard test/**/*.js) | tap-spec

dev:
	nodemon -q --watch src --watch test -x "make test || true"

examples: build
	echo "--> Running examples ..."
	open $(wildcard examples/*.html)

node_modules: package.json
	echo "--> Installing dependencies ..."
	npm -q install

clean:
	rm -rf lib node_modules

all: clean build test

.PHONY: clean all
.SILENT: build test node_modules clean examples