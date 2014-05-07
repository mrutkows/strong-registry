var Promise = require('bluebird');
var path = require('path');
var commander = require('commander');
var semver = require('semver');
var debug = require('debug')('strong-registry:promote');
var storage = require('../storage');
var execNpm = require('../exec-npm');
var RegistryConfig = require('../..').RegistryConfig;
var spawnNpmLogin = require('../spawn-npm-login');

module.exports = function promotePackage() {
  var args = parseArgs(Array.prototype.slice.call(arguments));

  var pkgSpec = parseNameAtVersionOrExit(args.args[0]);
  var from = resolveRegistryOrExit(args.from);
  var to = resolveRegistryOrExit(args.to);

  if (from.url == to.url) {
    abort('The "from" and "to" registries must be different.');
  }

  return setupDownloadCredentials()
    .then(setupPublishCredentials)
    .then(downloadTarball)
    .then(publishTarball)
    .error(function(err) {
      if (err instanceof Promise.RejectionError && err.cause)
        err = err.cause;
      console.error(err.message);
      process.exit(2);
    });

  function setupDownloadCredentials() {
    if (!from.config.requiresLogin()) return Promise.resolve();
    console.log(
      'The registry "%s" requires authentication for all requests',
      from.name
    );
    console.log('Running `npm login` to setup credentials.');
    return spawnNpmLogin(from.iniFile);
  }

  function setupPublishCredentials() {
    if (to.config.hasAuthCredentials()) return Promise.resolve();
    console.log(
      'Credentials are required to publish to the registry "%s".',
      to.name
    );
    console.log('Running `npm login` to set them up.');
    return spawnNpmLogin(to.iniFile);
  }

  function downloadTarball() {
    console.log(
      'Downloading %s from %s (%s)',
      pkgSpec.nameAtVersion,
      from.name,
      from.url);

    var args = [
      '--userconfig', from.iniFile,
      'cache', 'add', pkgSpec.nameAtVersion
    ];
    return execNpm(args)
      .then(function() {
        var tarball = getCachedTarballPath(from.cache, pkgSpec);
        debug('local tarball', tarball);
        return tarball;
      });
  }

  function publishTarball(tarball) {
    console.log(
      'Publishing %s to %s (%s)', pkgSpec.nameAtVersion, to.name, to.url);

    return execNpm(['--userconfig', to.iniFile, 'publish', tarball]);
  }
};

function parseArgs(argv) {
  // commander expects ["node", "script", args...] as argv
  argv.unshift('node');

  commander
    .option('--from [name]', 'the registry to download from')
    .option('--to [name]', 'the registry to publish to')
    .parse(argv);

  return commander;
}

function parseNameAtVersionOrExit(value) {
  if (!value) {
    abort('Missing a required parameter: package name@version.');
  }

  var c = value.split('@');
  var name = c.shift();
  var version = c.join('@');

  if (version === '') {
    abort ('Invalid package specifier %j: missing the version.', value);
  }

  if (!semver.valid(version)) {
    abort('The version string "%s" is not a valid semver.', version);
  }

  return {
    name: name,
    version: version,
    nameAtVersion: value,
  };
}

function resolveRegistryOrExit(name) {
  var config = storage.loadOrExit(name);

  return {
    name: name,
    url: config.registry,
    iniFile: storage.getIniPathForName(name),
    cache: storage.getCachePathForName(name),
    config: new RegistryConfig(config),
  };
}

function getCachedTarballPath(cacheDir, pkgSpec) {
  return path.join(
    cacheDir,
    pkgSpec.name,
    pkgSpec.version,
    'package.tgz'
  );
}

function abort(msg) {
  console.error.apply(console, arguments);
  process.exit(1);
}

