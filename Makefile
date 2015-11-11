BIN := node_modules/.bin

all: index.js cjpeg.js

$(BIN)/tsc:
	npm install

%.js: %.ts $(BIN)/tsc
	$(BIN)/tsc
