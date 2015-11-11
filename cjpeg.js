var os_1 = require('os');
var fs = require('fs');
var path_1 = require('path');
var child_process_1 = require('child_process');
var loge_1 = require('loge');
/**
Read image at `input_filepath` and write compressed JPEG to `output_filepath`.

It will clobber the file at `output_filepath` if it exists.

- `options.resize` is optional.
- `options.quality` is required

*/
function convert(input_filepath, output_filepath, options, callback) {
    var resize_args = options.resize ? "-resize " + options.resize : '';
    var convert_command = "convert \"" + input_filepath + "\" " + resize_args + " PNM:-";
    var cjpeg_command = "cjpeg -quality " + options.quality + " -outfile \"" + output_filepath + "\"";
    loge_1.logger.debug("$ " + convert_command + " | " + cjpeg_command);
    child_process_1.exec(convert_command + " | " + cjpeg_command, function (err, stdout, stderr) {
        if (err) {
            loge_1.logger.error('stdout: %s; stderr: %s', stdout, stderr);
            return callback(err);
        }
        if (stdout)
            loge_1.logger.info("stdout: " + stdout);
        if (stderr)
            loge_1.logger.debug("stderr: " + stderr);
        callback();
    });
}
exports.convert = convert;
/**
`dirname` should not end with a slash.
`basename` should contain no slashes.
`extname` should start with '.' if not empty.
*/
var SystemFile = (function () {
    function SystemFile(dirpath, basename, extname) {
        if (extname === void 0) { extname = ''; }
        this.dirpath = dirpath;
        this.basename = basename;
        this.extname = extname;
    }
    SystemFile.prototype.replace = function (_a) {
        var dirpath = _a.dirpath, basename = _a.basename, extname = _a.extname;
        return new SystemFile(dirpath || this.dirpath, basename || this.basename, extname || this.extname);
    };
    SystemFile.prototype.toString = function () {
        return this.dirpath + '/' + this.basename + this.extname;
    };
    SystemFile.parse = function (filepath) {
        var match = filepath.match(/^(.+\/)?([^/]+?)(\.[^.]+)$/);
        if (match === null) {
            throw new Error("SystemFile cannot parse filepath: \"" + filepath + "\"");
        }
        return new SystemFile((match[1] || './').replace(/\/$/, ''), match[2], match[3]);
    };
    return SystemFile;
})();
function convertWithBackup(input_filepath, options, callback) {
    var input_file = SystemFile.parse(input_filepath);
    var input_stats = fs.statSync(input_file.toString());
    var backup_file = input_file.replace({ extname: '.bak' + input_file.extname });
    // if the backup file already exists, return immediately
    var backup_exists = fs.existsSync(backup_file.toString());
    if (backup_exists) {
        loge_1.logger.error(backup_file.toString() + " already exists; not converting " + input_filepath);
        return callback();
    }
    var temp_directory = os_1.tmpdir();
    var temp_filepath = path_1.join(temp_directory, input_file.basename + input_file.extname);
    // temp_directory will be an existing directory, something like:
    //     /var/folders/m8/cq7z9jxj0774qz_3yg0kw5k40000gn/T/
    // var temp_filepath = temp.path({suffix: input_extname});
    loge_1.logger.debug("converting \"" + input_filepath + "\" (using tempfile \"" + temp_filepath + "\")");
    convert(input_filepath, temp_filepath, options, function (error) {
        if (error)
            return callback(error);
        // backup original
        loge_1.logger.debug("moving \"" + input_filepath + "\" to \"" + backup_file.toString() + "\"");
        fs.linkSync(input_filepath, backup_file.toString());
        // remove original
        fs.unlinkSync(input_filepath);
        // move tempfile into original's place
        loge_1.logger.debug("copying tempfile \"" + temp_filepath + "\" to \"" + input_filepath + "\"");
        fs.linkSync(temp_filepath, input_filepath);
        var converted_stats = fs.statSync(input_filepath);
        loge_1.logger.info("recompressed version of " + input_filepath + " is " + (100.0 * converted_stats.size / input_stats.size).toFixed(2) + "% the size of the original");
        callback();
    });
}
exports.convertWithBackup = convertWithBackup;
