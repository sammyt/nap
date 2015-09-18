PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash

build: node_modules src/nap.js
	echo "--> Building project ..."
	mkdir -p lib
	browserify src/nap.js --standalone nap -o lib/nap.js

test: build
	echo "--> Running tests ..."
	browserify $(wildcard test/*.js) $(wildcard test/**/*.js) > lib/test.js
	open test/index.html

node_modules: package.json
	echo "--> Installing dependencies ..."
	npm -q install

clean:
	rm -rf lib node_modules

all: clean build test

.PHONY: clean all
.SILENT: build test node_modules clean