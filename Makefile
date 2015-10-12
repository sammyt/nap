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
	@tape $(TST)

.nyc_output:
	@nyc $(MAKE) test

coverage: .nyc_output
	@nyc report --reporter=text-lcov | coveralls

dev:
	@nodemon -q -x "(clear; nyc $(MAKE) test | tap-dot && nyc report) || true"

release: clean build test
	@npm version $(v)
	@npm publish
	@git push --tags

examples: build
	@open $(wildcard examples/*.html)

clean:
	@rm -rf $$(cat .gitignore)

.PHONY: build test coverage dev release examples clean