exports = module.exports = function printHelp($0, println) {
  println();
  println('  Usage: %s [options] [command]', $0);
  println();
  println('  Commands:');
  println();
  println('    list               print registry configurations (default)');
  println('    add <name> [url]   create a new registry configuration');
  println('    use <name>         modify ~/.npmrc to use a different registry');
  println('    remove {name}      remove registry configuration');
  println();
  println('  Options:');
  println();
  println('    -h, --help         print usage information');
  println('    -v, --version      print the version number');
  println();
};
