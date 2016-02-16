var os_1 = require('os');
var async = require('async');
var optimist = require('optimist');
var loge_1 = require('loge');
var cjpeg_1 = require('./cjpeg');
/** recjpeg

Given a list of JPEG files, do the following to each:

1. recompress input.jpg to input.recompressed.jpg
  a. using the specified quality
  b. and an optional -resize flag

*/
function main() {
    var argvparser = optimist
        .usage("Usage: recjpeg 01.jpg [02.jpg, ...]\n\nRecompress a series of JPEG files with cjpeg.")
        .describe({
        limit: 'number of files to process in parallel',
        quality: 'cjpeg -quality setting',
        resize: 'convert -resize argument (e.g., 50%, 1000x1000, 2000x2000>)',
        help: 'print this help message',
        verbose: 'print extra output',
    })
        .alias({
        help: 'h',
        verbose: 'v',
    })
        .default({
        limit: os_1.cpus().length,
        quality: 90,
    })
        .boolean(['help', 'verbose']);
    var argv = argvparser.argv;
    if (argv.help) {
        argvparser.showHelp();
        process.exit(0);
    }
    loge_1.logger.level = argv.verbose ? loge_1.Level.debug : loge_1.Level.info;
    argvparser = argvparser.demand(1);
    argv = argvparser.argv;
    var options = { quality: argv.quality, resize: argv.resize };
    var filepaths = argv._;
    loge_1.logger.info("recompressing " + filepaths.length + " files");
    async.eachLimit(filepaths, argv.limit, function (filepath, callback) {
        cjpeg_1.convertWithBackup(filepath, options, callback);
    }, function (error) {
        if (error)
            throw error;
        loge_1.logger.debug("Done recompressing " + filepaths.length + " files");
        process.exit(0);
    });
}
exports.main = main;
