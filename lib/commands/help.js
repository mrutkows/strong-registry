exports = module.exports = function help($0) {
  printHelp($0, console.log);
};

function printHelp($0, println) {
  println();
  println('Usage:');
  println('    %s [command]', $0);
  println();
  println('Commands:');
  println();
  println('  list               - print registry configurations (default)');
  println();
  println('  add {name} {url}   - create a new registry configuration');
  println();
  println('  use {name}         - modify ~/.npmrc to use a different registry');
  println();
  println('  version            - print the app version');
  println();
  println('  help               - print this help');
  println();
}
exports.printHelp = printHelp;

