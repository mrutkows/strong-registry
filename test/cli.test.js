var path = require('path');
var fs = require('fs-extra');
var ini = require('ini');
var storage = require('../').storage;
var expect = require('must');
var sandbox = require('./helpers/sandbox');
var CliRunner = require('./helpers/cli-runner');

describe('sl-registry script', function() {
  beforeEach(sandbox.reset);

  describe('on the first run', function() {
    it('prints info message', function() {
      return new CliRunner()
        .expect('Running for the first time')
        .run();
    });

    it('creates $HOME/.strong-registry', function() {
      return new CliRunner()
        .run()
        .then(function(stdout) {
          var dir = path.resolve(CliRunner.HOME, '.strong-registry');
          expect(fs.existsSync(dir), dir + ' exists').to.be.true();
        });
    });
  });

  describe('with no command', function() {
    beforeEach(givenInitializationWasAlreadyDone);
    it('lists available configurations', function() {
      return new CliRunner()
        .expect('Available configurations:')
        .expect(' * default (https://registry.npmjs.org/)')
        .expect(
          'Run `sl-registry.js use <name>` to switch to a different registry'
        )
        .run();
    });

    it('uses env.CMD as $0', function() {
      return new CliRunner({ env: { CMD: 'TEST-CMD' }})
        .run()
        .then(function(stdout) {
          expect(stdout.pop()).to.match(/Run `TEST-CMD use <name>`/);
        });
    });

    it('flags the active configuration', function() {
      givenAdditionalEntry('another', { registry: 'http://another/registry'});
      return new CliRunner()
        .waitForAvailableConfigurations()
        .expect('   another (http://another/registry)')
        .expect(' * default (https://registry.npmjs.org/)')
        .run();
    });
  });

  describe('add', function() {
    beforeEach(givenInitializationWasAlreadyDone);

    it('reads options and creates a new entry', function() {
      return new CliRunner(['add', 'custom', 'http://custom/registry'])
        .expect('Adding a new configuration "custom"')

        .waitFor('Registry URL: (http://custom/registry)')
        .sendLine('') // use the provided default

        .waitFor('HTTP proxy:').sendLine('http://proxy')
        .waitFor('HTTPS proxy:').sendLine('https://secure-proxy')
        .waitFor('User name:').sendLine('a-user-name')
        .waitFor('Email:').sendLine('user@example.com')
        .waitFor('Always authenticate? (Y/n)').sendLine('')

        .waitFor('Check validity of server SSL certificates? (Y/n)')
        .sendLine('')

        .waitFor('Configuration "custom" was created.')
        .expect('Run `sl-registry.js use "custom"` to let' /* etc. */)
        .run()
        .then(function() {
          var config = readNamedEntry('custom');
          expect(config).to.eql({
            registry: 'http://custom/registry',
            proxy: 'http://proxy',
            'https-proxy': 'https://secure-proxy',
            username: 'a-user-name',
            email: 'user@example.com',
            'always-auth': true,
            'strict-ssl': true,
          });
        });
    });

    it('offers default values from npmrc', function() {
      givenNpmRc({
        proxy: 'npmrc-proxy',
        'https-proxy': 'npmrc-https-proxy',
        username: 'npmrc-username',
        email: 'npmrc-email',
      });

      return new CliRunner(['add', 'custom', 'http://registry'])
        .waitFor('Registry URL:').sendLine('')
        .waitFor('HTTP proxy: (npmrc-proxy)').sendLine('')
        .waitFor('HTTPS proxy: (npmrc-https-proxy)').sendLine('')
        .waitFor('User name: (npmrc-username)').sendLine('')
        .waitFor('Email: (npmrc-email').sendLine('')
        .run();
    });
  });
});

function givenInitializationWasAlreadyDone() {
  return new CliRunner().run();
}

function givenNpmRc(config) {
  var file = path.resolve(CliRunner.HOME, '.npmrc');
  fs.writeFileSync(file, ini.stringify(config), 'utf-8');
}

function givenAdditionalEntry(name, config) {
  var file = getIniFilePath(name);
  fs.writeFileSync(file, ini.stringify(config), 'utf-8');
}

function readNamedEntry(name) {
  var file = getIniFilePath(name);
  var content = fs.readFileSync(file, 'utf-8');
  return ini.parse(content);
}

function getIniFilePath(name) {
  return path.resolve(CliRunner.HOME, '.strong-registry', name + '.ini');
}
