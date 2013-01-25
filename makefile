
all:
	uglifyjs ./src/nap.js ./components/rhumb/rhumb.js -o nap.js -c -m
	# woop woop