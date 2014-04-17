var path = require('path');
var fs = require('fs-extra');

var sandbox = module.exports;

sandbox.PATH = path.resolve(__dirname, '..', 'sandbox');

sandbox.reset = function() {
  fs.removeSync(sandbox.PATH);
  fs.mkdirsSync(sandbox.PATH);
};

sandbox.resolve = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(sandbox.PATH);
  return path.resolve.apply(path, args);
};
