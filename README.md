# recjpeg

[![npm version](https://badge.fury.io/js/recjpeg.svg)](https://www.npmjs.com/package/recjpeg)

For re-encoding JPEGs at the command line using a better `cjpeg` than the original.

    npm install -g recjpeg

Example:

    find . -iname '*.jpg' | grep -v bak | xargs recjpeg --quality 80
    rm **/*.bak.*

Goes well with [qualcomp](https://github.com/chbrown/qualcomp) to determine what quality you want for your images.


## License

Copyright 2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).
