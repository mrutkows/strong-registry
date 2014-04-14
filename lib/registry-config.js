var extend = require('util')._extend;
var fs = require('fs');
var ini = require('ini');

exports = module.exports = RegistryConfig;

var TRACKED_OPTIONS = [
  'registry',
  'username',
  'email',
  'proxy',
  'https-proxy',
  'local-address',
  'strict-ssl',
  'always-auth'
];

/**
 * Creates a new instance of registry object.
 * @param {Object} config Registry configuration (url, username, etc.)
 * @constructor
 */
function RegistryConfig(config) {
  for (var k in config) {
    if (TRACKED_OPTIONS.indexOf(k) !== -1)
      this[k] = config[k];
  }
}

/**
 * Create a default registry.
 * @param {string} npmRcPath Path to ~/.npmrc file with user's default settings
 * @returns {RegistryConfig}
 */
RegistryConfig.createDefault = function(npmRcPath) {
  var npmrc = loadIniFile(npmRcPath, {});

  // TODO(bajtos) load the default registry URL from system and built-in npmrc

  var config = extend(
    { registry: 'https://registry.npmjs.org/' },
    npmrc);

  return new RegistryConfig(config);
};

function loadIniFile(file, fallbackValue) {
  if (!fs.existsSync(file)) return fallbackValue;
  var content = fs.readFileSync(file, 'utf-8');
  return ini.parse(content);
}
