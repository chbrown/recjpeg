#!/usr/bin/env node
import {cpus} from 'os';
import * as async from 'async';
import * as optimist from 'optimist';
import {logger, Level} from 'loge';
import {validateBackup, convertWithBackup, BackupResult, ConvertResult} from '../backup';
import {reportCompressionResult, CompressionResult} from '../report';

export function main() {
  let argvparser = optimist
  .usage(`Usage: recjpeg 01.jpg [02.jpg, ...]

(Re-)Compress the given image files to JPEGs, using the specified --quality
(and --resize, if specified), by first reading with ImageMagick's 'convert'
command, and encoding as JPEG with whatever 'cjpeg' command is on the PATH.

For each argument:
1. Run the pipeline and create a new temporary file with the output
2. Rename the original file with its extension '.bak'-prefixed
3. Move the temporary file into the original file's place`)
  .options({
    limit: {
      describe: 'number of files to process in parallel',
      default: cpus().length,
    },
    quality: {
      describe: 'cjpeg -quality argument (ranges from 1-100)',
      default: 90,
    },
    resize: {
      describe: 'convert -resize argument (e.g., 50%, 1000x1000, 2000x2000>)',
    },
    help: {
      describe: 'print this help message',
      alias: 'h',
      type: 'boolean',
    },
    verbose: {
      describe: 'print extra output',
      alias: 'v',
      type: 'boolean',
    },
  });

  const {help, verbose} = argvparser.argv;
  if (help) {
    argvparser.showHelp();
    process.exit(0);
  }

  logger.level = verbose ? Level.debug : Level.info;

  argvparser = argvparser.demand(1);
  const {_: filepaths, limit, quality, resize} = argvparser.argv;
  return run(filepaths, limit, quality, {resize}, error => {
    if (error) throw error;
    process.exit(0);
  });
}

function run(filepaths: string[],
             limit: number,
             quality: number | string,
             options: {resize?: string},
             callback: (error?: Error) => void) {
  logger.info(`Checking ${filepaths.length} files can be backed up`);
  async.mapLimit<string, BackupResult>(filepaths, limit, (filepath, callback) => {
    validateBackup(filepath, (error, result) => {
      // turn errors into null results, to be filtered out later
      if (error) {
        logger.info(`${error.message} - ignoring ${filepath}`);
      }
      return callback(null, error ? null : result);
    });
  }, (error, backupResults) => {
    if (error) return callback(error);
    const validBackupResults = backupResults.filter(backupResult => backupResult !== null);
    if (validBackupResults.length === 0) {
      // early quit, since there's nothing to do
      return callback();
    }
    logger.info(`Starting recompressing ${validBackupResults.length} files`);
    async.mapLimit<BackupResult, ConvertResult>(validBackupResults, limit, ({input, backup}, callback) => {
      convertWithBackup(input, backup, quality, options, callback);
    }, (error, convertResults) => {
      if (error) return callback(error);
      logger.debug(`Done recompressing ${filepaths.length} files`);
      async.eachLimit(convertResults, limit, ({output, backup}, callback) => {
        reportCompressionResult(backup, output, (error, compressionResult) => {
          if (error) return callback(error);
          logger.info(compressionResult.message);
          callback();
        });
      }, callback);
    });
  });
}

if (require.main === module) {
  main();
}
