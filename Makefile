BIN := node_modules/.bin
DTS := node/node yargs/yargs async/async

all: index.js cjpeg.js type_declarations

type_declarations: $(DTS:%=type_declarations/DefinitelyTyped/%.d.ts)
type_declarations/DefinitelyTyped/%:
	mkdir -p $(@D)
	curl -s https://raw.githubusercontent.com/borisyankov/DefinitelyTyped/master/$* > $@

$(BIN)/%:
	npm install

%.js: %.ts type_declarations $(BIN)/tsc
	$(BIN)/tsc -m commonjs -t ES5 $<
