var path = require('path');
var fs = require('fs-extra');
var ini = require('ini');
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
    beforeEach(sandbox.givenInitializedStorageWithDefaultEntry);
    it('lists available configurations', function() {
      return new CliRunner()
        .expect('Available configurations:')
        .expect(' * default (https://registry.npmjs.org/)')
        .expect(
          'Run `sl-registry.js use <name>` to switch to a different registry'
        )
        .run();
    });

    it('uses env.SLC_COMMAND as $0', function() {
      return new CliRunner({ env: { SLC_COMMAND: 'TEST-CMD' }})
        .run()
        .then(function(stdout) {
          expect(stdout.pop()).to.match(/Run `slc TEST-CMD use <name>`/);
        });
    });

    it('flags the active configuration', function() {
      sandbox.givenAdditionalEntry(
        'another',
        { registry: 'http://another/registry'}
      );
      return new CliRunner()
        .waitForAvailableConfigurations()
        .expect('   another (http://another/registry)')
        .expect(' * default (https://registry.npmjs.org/)')
        .run();
    });
  });

  describe('add', function() {
    beforeEach(sandbox.givenInitializedStorageWithDefaultEntry);

    itOnUnix('reports error when no name is provided', function() {
      return new CliRunner(['add'], { stream: 'stderr' })
        .expectExitCode(1)
        .expect('Missing a required parameter: registry name.')
        .run();
    });

    it('reads options and creates a new entry', function() {
      return new CliRunner(['add', 'custom', 'http://custom/registry'])
        .expect('Adding a new configuration "custom"')

        .waitFor('Registry URL: (http://custom/registry)')
        .sendLine('') // use the provided default

        .waitFor('HTTP proxy:').sendLine('http://proxy')
        .waitFor('HTTPS proxy:').sendLine('https://secure-proxy')
        .waitFor('Email:').sendLine('user@example.com')
        .waitFor('Always authenticate? (Y/n)').sendLine('')

        .waitFor('Check validity of server SSL certificates? (Y/n)')
        .sendLine('')

        .waitFor('Configuration "custom" was created.')
        .expect('Run `sl-registry.js use "custom"` to let' /* etc. */)
        .run()
        .then(function() {
          var config = sandbox.load('custom');
          expect(config).to.eql({
            registry: 'http://custom/registry',
            proxy: 'http://proxy',
            'https-proxy': 'https://secure-proxy',
            email: 'user@example.com',
            cache: sandbox.getCachePathForName('custom'),
            'always-auth': true,
            'strict-ssl': true,
          });
        });
    });

    it('offers default values from ~/.npmrc', function() {
      sandbox.givenUserNpmRc({
        proxy: 'npmrc-proxy',
        'https-proxy': 'npmrc-https-proxy',
        username: 'npmrc-username',
        email: 'npmrc-email',
      });

      return new CliRunner(['add', 'custom', 'http://registry'])
        .waitFor('Registry URL:').sendLine('')
        .waitFor('HTTP proxy: (npmrc-proxy)').sendLine('')
        .waitFor('HTTPS proxy: (npmrc-https-proxy)').sendLine('')
        .waitFor('Email: (npmrc-email').sendLine('')
        .run();
    });

    it('deletes keys with empty value', function() {
      // empty value means use default
      // this is achieved by omitting the option from the ini file
      return new CliRunner(['add', 'custom', 'http://registry'])
        .waitFor('Registry URL:').sendLine()
        .waitFor('HTTP proxy:').sendLine()
        .waitFor('HTTPS proxy:').sendLine()
        .waitFor('Email:').sendLine()
        .waitFor('Always auth').sendLine()
        .waitFor('Check validity').sendLine()
        .run()
        .then(function() {
          var config = sandbox.load('custom');
          expect(config).to.eql({
            registry: 'http://registry',
            cache: sandbox.getCachePathForName('custom'),
            'always-auth': true,
            'strict-ssl': true
          });
        });
    });

    it('sets unique cache path', function() {
      return new CliRunner(['add', 'custom', 'http://registry'])
        .waitFor('Registry URL:').sendLine()
        .waitFor('HTTP proxy:').sendLine()
        .waitFor('HTTPS proxy:').sendLine()
        .waitFor('Email:').sendLine()
        .waitFor('Always auth').sendLine()
        .waitFor('Check validity').sendLine()
        .run()
        .then(function() {
          var npmrc = sandbox.load('custom');
          expect(npmrc.cache).to.equal(sandbox.getCachePathForName('custom'));
        });
    });
  });

  describe('use', function() {
    beforeEach(sandbox.givenInitializedStorageWithDefaultEntry);

    itOnUnix('reports error when configuration does not exist', function() {
      return new CliRunner(['use', 'unknown'], { stream: 'stderr' })
        .expectExitCode(1)
        .expect('Unknown registry: "unknown"')
        .run();
    });

    itOnUnix('reports error when no name is provided', function() {
      return new CliRunner(['use'], { stream: 'stderr' })
        .expectExitCode(1)
        .expect('Missing a required parameter: registry name.')
        .run();
    });

    it('updates ~/.npmrc', function() {
      sandbox.givenAdditionalEntry(
        'custom',
        { registry: 'http://private/registry' }
      );
      return new CliRunner(['use', 'custom'])
        .expect('Using the registry "custom" (http://private/registry).')
        .run()
        .then(function() {
          var npmrc = sandbox.readUserNpmRrc();
          expect(npmrc.registry).to.equal('http://private/registry');
        });
    });

    it('deletes entries not defined in registry config', function() {
      sandbox.givenAdditionalEntry('custom');
      sandbox.givenUserNpmRc({ proxy: 'http://proxy' });
      return new CliRunner(['use', 'custom'])
        .run()
        .then(function() {
          var npmrc = sandbox.readUserNpmRrc();
          expect(npmrc.proxy).to.be.undefined();
        });
    });

    it('updates registry config from ~/.npmrc', function() {
      sandbox.givenAdditionalEntry('custom');
      sandbox.givenUserNpmRc({ _auth: 'user:name' });
      return new CliRunner(['use', 'custom'])
        .expect('Updating "default" with config from npmrc.')
        .run()
        .then(function() {
          var rc = sandbox.load('default');
          expect(rc._auth).to.equal('user:name');
        });
    });

    it('warns when ~/.npmrc contains unknown registry', function() {
      sandbox.givenAdditionalEntry('custom');
      sandbox.givenUserNpmRc({ registry: 'http://unknown-registry' });
      return new CliRunner(['use', 'custom'])
        .expect('Discarding npmrc configuration of an unknown registry ' +
          'http://unknown-registry')
        .run();
    });

    it('runs `npm login` when always-auth is enabled', function () {
      sandbox.givenAdditionalEntry('custom', { 'always-auth': true });
      return new CliRunner(['use', 'custom'])
        .expect('Using the registry "custom"')
        .expect('The registry requires authentication for all requests.')
        .expect('Running `npm login` to setup credentials.')
        .expect('Username:')
        .run();
    });
  });

  describe('remove', function() {
    beforeEach(sandbox.givenInitializedStorageWithDefaultEntry);

    itOnUnix('reports error when configuration does not exist', function() {
      return new CliRunner(['remove', 'unknown'], { stream: 'stderr' })
        .expectExitCode(1)
        .expect('Unknown registry: "unknown"')
        .run();
    });

    itOnUnix('reports error when no name is provided', function() {
      return new CliRunner(['remove'], { stream: 'stderr' })
        .expectExitCode(1)
        .expect('Missing a required parameter: registry name.')
        .run();
    });

    itOnUnix('reports error when name is "default"', function() {
      return new CliRunner(['remove', 'default'], { stream: 'stderr' })
        .expectExitCode(1)
        .expect('The default registry cannot be removed.')
        .run();
    });

    it('removes config file and cache file', function() {
      sandbox.givenAdditionalEntry('custom');
      var cachePath = sandbox.getCachePathForName('custom');
      fs.mkdirsSync(cachePath);

      return new CliRunner(['remove', 'custom'])
        .expect('The registry "custom" was removed.')
        .run()
        .then(function() {
          var iniPath = sandbox.getIniPathForName('custom');
          expect(fs.existsSync(iniPath), 'ini exists').to.be.false();
          expect(fs.existsSync(cachePath), 'cache exists').to.be.false();
        });
    });
  });

  function itOnUnix(name, test) {
    // Skip tests that fail due to bug in Windows implementation of Node.js
    // https://github.com/joyent/node/issues/3584
    if (process.platform == 'win32')
      it.skip(name, test);
    else
      it(name, test);
  }
});
