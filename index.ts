import {exec} from 'child_process'
import {logger} from 'loge'

const shellSpecialRegExp = /\s|[|<>;&]/ // TODO: should check for way more than whitespace

function sh(literals: TemplateStringsArray, ...args: unknown[]): string {
  // IIUC, it's always the case that: literals.length == args.length + 1
  const parts: string[] = []
  for (let i = 0; i < args.length; i++) {
    // ensure given argument is a string
    let arg = args[i]?.toString() ?? ''
    // check and escape if needed
    if (shellSpecialRegExp.test(arg)) {
      // escape single quotes
      arg = arg.replace(/'/g, '\\$0')
      // then wrap in single quotes
      arg = `'${arg}'`
    }
    parts.push(literals[i], arg)
  }
  parts.push(literals[literals.length - 1])
  return parts.join('')
}

function extendExecError(error: Error, stdout: string, stderr: string) {
  const stdout_messages = stdout ? [`/dev/stdout: ${stdout}`] : []
  const stderr_messages = stderr ? [`/dev/stderr: ${stderr}`] : []
  error.message = [error.message, ...stdout_messages, ...stderr_messages].join('\n')
}

/**
Read image at `input` and write compressed JPEG to `output`, clobbering any file
that might already exist at that location.
*/
export function convert(
  input: string,
  output: string,
  quality: number | string,
  options: {resize?: string},
  callback: (error?: Error) => void,
) {
  const resize_args = options.resize ? sh`-resize ${options.resize}` : ''
  const convert_command = sh`convert ${input} ${resize_args} PNM:-`
  const cjpeg_command = sh`cjpeg -quality ${quality} -outfile ${output}`

  const command = `${convert_command} | ${cjpeg_command}`
  logger.debug(`$ ${command}`)
  return exec(command, (err, stdout, stderr) => {
    if (err) {
      extendExecError(err, stdout, stderr)
      return callback(err)
    }
    if (stdout) logger.debug(`/dev/stdout: ${stdout}`)
    if (stderr) logger.debug(`/dev/stderr: ${stderr}`)
    callback()
  })
}
