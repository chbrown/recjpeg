# recjpeg

[![npm version](https://badge.fury.io/js/recjpeg.svg)](https://www.npmjs.com/package/recjpeg)

For re-encoding JPEGs at the command line using a better `cjpeg` than the original.

    npm install -g recjpeg

Example:

    find . -iname '*.jpg' | grep -v bak | xargs recjpeg --quality 80
    rm **/*.bak.*

Goes well with [qualcomp](https://github.com/chbrown/qualcomp) to determine what quality you want for your images.


## License

Copyright 2015-2017 Christopher Brown. [MIT Licensed](http://chbrown.github.io/licenses/MIT/#2015-2017)
