var path = require('path');
var storage = require('./storage');
var RegistryConfig = require('./registry-config');

exports.createDefaultConfig = function() {
  var npmRcPath = path.join(process.env.HOME, '.npmrc');
  return RegistryConfig.createDefault(npmRcPath);
};

exports.init = storage.init;
exports.storage = storage;
exports.RegistryConfig = RegistryConfig;

var commands =  {
  list: require('./commands/list'),
  add: require('./commands/add')
};
exports.commands = commands;
