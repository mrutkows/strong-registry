var assert = require('assert');
var path = require('path');
var fs = require('fs');
var ini = require('ini');
var debug = require('debug')('strong-registry:storage');

var storage = exports;

var DATA_DIR;

/**
 * Initialize the storage of registry configurations
 * @param {string} dataDir Location where to keep all configuration files
 * @param {function(): Object} defaultConfigFn Factory function for settings
 * of the default registry
 * @param {function(...Object)} log Logger function
 */
storage.init = function(dataDir, defaultConfigFn, log) {
  DATA_DIR = dataDir;
  log = log || function() {};

  if (fs.existsSync(DATA_DIR)) return;

  log('Running for the first time.');
  try {
    fs.mkdirSync(DATA_DIR);
  } catch (err) {
    var msg = 'Cannot create ' + JSON.stringify(DATA_DIR) + ': ' + err.message;
    throw new Error(msg);
  }
  log('Created %s\n', DATA_DIR);

  var config = defaultConfigFn();
  assert(config.registry, 'default config must have "registry" property');
  storage.store('default', config);
  log('Added "default" registry (%s)', config.registry);
};

/**
 * List names of configurations
 * @returns {Array.<string>}
 */
storage.listNames = function() {
  var EXT = /\.ini$/;

  return fs.readdirSync(DATA_DIR)
    .filter(function(fileName) { return EXT.test(fileName); })
    .map(function(fileName) { return fileName.replace(EXT, ''); });
};

/**
 * Create or update a named configuration.
 * @param {string} name
 * @param {Object} config
 */
storage.store = function(name, config) {
  var file = getPathForName(name);
  var content = ini.stringify(config);
  debug('store %s %s', file, content);
  fs.writeFileSync(file, content, 'utf-8');
};

/**
 * Load a named configuration
 * @param {string} name
 * @returns {Object}
 */
storage.load = function(name) {
  var file = getPathForName(name);
  return storage.loadIniFile(file);
};

/**
 * Resolve a path relative to data directory.
 * @param {...string} varArgs
 * @returns {string}
 */
storage.resolvePath = function(varArgs) {
  var args = [DATA_DIR].concat(Array.prototype.slice.call(arguments));
  return path.resolve.apply(path, args);
};

/**
 * Read and parse an ini file.
 * @param {string} file
 * @returns {Object}
 */
storage.loadIniFile = function(file) {
  var content = fs.readFileSync(file, 'utf-8');
  debug('loaded %s %s', file, content);
  return ini.parse(content);
};

function getPathForName(name) {
  return storage.resolvePath(name + '.ini');
}


