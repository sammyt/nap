
all:
	uglifyjs ./src/nap.js ./lib/tabs.js -o out/nap.js -c -m
	# woop woop