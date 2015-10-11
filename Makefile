PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash

SRC = $(wildcard src/*.js)
LIB = $(SRC:src/%.js=lib/%.js)
TST = $(wildcard test/*.js) $(wildcard test/**/*.js)
NPM = @npm install --local > /dev/null && touch node_modules

v  ?= patch

build: node_modules $(LIB)
lib/%.js: src/%.js
	@mkdir -p $(@D)
	@browserify $< --standalone nap | uglifyjs -o $@

node_modules: package.json
	$(NPM)
node_modules/%:
	$(NPM)

test: build
	@tap --coverage $(TST)

test-dev: build
	@nodemon -q -x "(clear; tape $(TST) | tap-dot) || true"

release: clean build test
	@npm version $(v)
	@npm publish

examples: build
	@open $(wildcard examples/*.html)

clean:
	@rm -rf $$(cat .gitignore)

.PHONY: build test test-dev release examples clean