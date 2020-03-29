import {tmpdir} from 'os';
import {access, linkSync, unlinkSync} from 'fs';
import {basename, dirname, join} from 'path';
import {logger} from 'loge';
import {convert} from './index';

function replaceExtension(path: string, fn: (extension: string) => string): string {
  // group2 captures a literal . followed by one or more non-dot, non-slash
  // characters at the end of the string; group1 captures everything preceding that
  return path.replace(/^(.+?)(\.[^.\\]+)?$/, (_, group1, group2) => {
    return group1 + fn(group2 || '');
  });
}

/**
Try to infer the case of `source` and return some case-variation of `target` that matches.
*/
function matchCase(source: string, target: string): string {
  // all caps
  if (/^[A-Z0-9]+$/.test(source)) {
    return target.toUpperCase();
  }
  // titlecase (or something approaching titlecase)
  else if (/^[A-Z]$/.test(source)) {
    return target[0].toUpperCase() + target.slice(1).toLowerCase();
  }
  // lowercase
  else if (/^[a-z0-9]+$/.test(source)) {
    return target.toLowerCase();
  }
  // otherwise, return target as-is
  return target;
}

function moveSync(existingPath: string, newPath: string) {
  logger.debug(`linking "${existingPath}" to "${newPath}"`);
  linkSync(existingPath, newPath);
  logger.debug(`unlinking "${existingPath}"`);
  unlinkSync(existingPath);
}

export interface InputResult {
  input: string;
}

export interface BackupResult extends InputResult {
  backup: string;
}

export interface ConvertResult extends BackupResult {
  output: string;
}

/**
Check that `input` has a valid backup path available, and return it.
*/
export function validateBackup(
  input: string,
  callback: (error: Error, result?: BackupResult) => void,
) {
  // extension might be the empty string
  const backup = replaceExtension(input, extension => '.bak' + extension);
  access(backup, error => {
    if (error) {
      // yay, no such file exists
      return callback(null, {input, backup});
    }
    callback(new Error(`File already exists: ${backup}`));
  });
}

export function convertWithBackup(
  input: string,
  backup: string,
  quality: number | string,
  options: {resize?: string},
  callback: (error: Error, result?: ConvertResult) => void,
) {
  // coerce the extension to match /\.jpe?g/i
  const name = replaceExtension(basename(input), extension => {
    if (/^\.jpe?g$/i.test(extension)) {
      return extension;
    }
    // if it doesn't match, use 'jpg' and match case as well as we're able
    return '.' + matchCase(extension.slice(1), 'jpg');
  });
  const output = join(dirname(input), name);
  // tmpdir() returns an existing directory, something like:
  //     /var/folders/m8/cq7z9jxj0774qz_3yg0kw5k40000gn/T/
  const temporary = join(tmpdir(), name);
  // var temp_filepath = temp.path({suffix: input_extname});
  // logger.debug(`converting "${input}" (using tempfile "${temp_filepath}")`);
  convert(input, temporary, quality, options, error => {
    if (error) return callback(error);
    // backup original
    moveSync(input, backup);
    // move tempfile into original's place
    moveSync(temporary, output);
    callback(null, {input, output, backup});
  });
}
