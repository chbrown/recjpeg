import {exec} from 'child_process';
import {logger} from 'loge';

const shellSpecialRegExp = /\s|[|<>;&]/; // TODO: should check for way more than whitespace

function stringifyShellArgument(arg): string {
  return (arg === undefined || arg === null) ? '' : arg.toString();
}

function escapeShellArgument(arg): string {
  // check if escaping is needed, first
  if (shellSpecialRegExp.test(arg)) {
    // escape single quotes
    const escapedArg = arg.replace(/'/g, '\\$0');
    // then wrap in single quotes
    return "'" + escapedArg + "'";
  }
  return arg;
}

function joinShellArguments(...args: any[]): string {
  return args.map(stringifyShellArgument).map(escapeShellArgument).join(' ');
}

function extendExecError(error: Error, stdout: string, stderr: string) {
  const stdout_messages = stdout ? [`/dev/stdout: ${stdout}`] : []
  const stderr_messages = stderr ? [`/dev/stderr: ${stderr}`] : []
  error.message = [error.message, ...stdout_messages, ...stderr_messages].join('\n');
}

/**
Read image at `input` and write compressed JPEG to `output`, clobbering any file
that might already exist at that location.
*/
export function convert(input: string,
                        output: string,
                        quality: number | string,
                        options: {resize?: string},
                        callback: (error?: Error) => void) {
  const resize_args = options.resize ? ['-resize', options.resize] : [];
  const convert_command = ['convert', input, ...resize_args, 'PNM:-'];
  const cjpeg_command = ['cjpeg', '-quality', quality, '-outfile', output];
  const command = joinShellArguments(...convert_command) + ' | ' + joinShellArguments(...cjpeg_command);
  logger.debug(`$ ${command}`);
  return exec(command, (err, stdout, stderr) => {
    if (err) {
      extendExecError(err, stdout, stderr);
      return callback(err);
    }
    if (stdout) logger.debug(`/dev/stdout: ${stdout}`);
    if (stderr) logger.debug(`/dev/stderr: ${stderr}`);
    callback();
  });
}
