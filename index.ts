import {cpus} from 'os';
import async = require('async');
import yargs = require('yargs');
import {logger, Level} from 'loge';
import {convertWithBackup} from './cjpeg';

/** recjpeg

Given a list of JPEG files, do the following to each:

1. recompress input.jpg to input.recompressed.jpg
  a. using the specified quality
  b. and an optional -resize flag

*/
export function main() {
  var argparser = yargs
  .usage(`Usage: recjpeg 01.jpg [02.jpg, ...]

Recompress a series of JPEG files with cjpeg.`)
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
    limit: cpus().length,
    quality: 90,
  })
  .boolean(['help', 'verbose']);

  var argv = yargs.argv;
  if (argv.help) {
    yargs.showHelp();
    process.exit(0);
  }

  logger.level = argv.verbose ? Level.debug : Level.info;

  yargs.demand(1);

  var options = {quality: argv.quality, resize: argv.resize};
  var filepaths: string[] = argv._;

  logger.info(`recompressing ${filepaths.length} files`);
  async.eachLimit(filepaths, argv.limit, (filepath, callback) => {
    convertWithBackup(filepath, options, callback);
  }, error => {
    if (error) throw error;

    logger.debug(`Done recompressing ${filepaths.length} files`);
    process.exit(0);
  });
}
