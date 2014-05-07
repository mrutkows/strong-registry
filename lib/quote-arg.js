module.exports = function quoteArg(arg) {
  if (!/[ \t]/.test(arg))
    return arg;
  if (!/"/.test(arg))
    return '"' + arg + '"';

  // See strong-cli/lib/command for full implementation of windows quoting
  // https://github.com/strongloop/strong-cli/blob/master/lib/command.js
  // Since we don't expect " in npm arguments, let's skip full quoting
  // and throw an error instead.
  throw new Error('command line arguments must not contain \'"\' character');
};
