
all:
	uglifyjs ./src/nap.js ./components/rhumb/rhumb.js -o nap.js -b indent-level=2 -v 
	# woop woop
