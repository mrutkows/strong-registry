var storage = require('../storage');
var RegistryConfig = require('../registry-config');

var NPM_RC_PATH = require('../').getUserNpmRc();

module.exports = function useRegistry($0, name) {
  var rc = loadRegistryConfigOrExit(name);
  var npmrc = storage.tryReadIniFile(NPM_RC_PATH, {});

  updateCurrentRegistryFromNpmRc(npmrc);

  rc.applyTo(npmrc);
  npmrc.cache = storage.getCachePathForName(name);
  storage.writeIniFile(NPM_RC_PATH, npmrc);

  console.log('Using the registry "%s" (%s).', name, rc.registry);
};

function loadRegistryConfigOrExit(name) {
  var rc;
  try {
    rc = new RegistryConfig(storage.load(name));
  } catch (err) {
    if (err.code == 'ENOENT') {
      console.error('Unknown registry: "%s"', name);
      process.exit(1);
    }
    throw err;
  }
  return rc;
}

function updateCurrentRegistryFromNpmRc(npmrc) {
  var currentRegistryUrl = npmrc.registry || RegistryConfig.getDefaultUrl();

  var current = findRegistryConfigByUrl(currentRegistryUrl);
  if (!current) {
    console.log(
      'Discarding npmrc configuration of an unknown registry %s',
      currentRegistryUrl);
    return;
  }

  var old = new RegistryConfig(current.rc);
  current.rc.updateFrom(npmrc);

  if (wasUpdated(old, current.rc)) {
    console.log('Updating "%s" with config from npmrc.', current.name);
    storage.store(current.name, current.rc);
  }
}

function findRegistryConfigByUrl(url) {
  return storage.listNames()
    .map(function addConfigToName(name) {
      return {
        name: name,
        rc: new RegistryConfig(storage.load(name))
      };
    })
    // filter()[0] behaves like ES6 find()
    .filter(function registryConfigIsCurrent(it) {
      return it.rc.registry == url;
    })[0];
}

function wasUpdated(old, current) {
  var diffs = Object.keys(old)
    .concat(Object.keys(current))
    .filter(function configPropertyWasUpdated(k) {
      return old[k] !== current[k];
    });

  return !!diffs.length;
}
