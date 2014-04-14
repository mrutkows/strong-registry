var inquirer = require('inquirer');
var storage = require('../storage');
var RegistryConfig = require('../registry-config');
var defaults = require('../').createDefaultConfig();

module.exports = function addNewRegistry($0, name, registryUrl) {

  var questions = [
    { name: 'registry',
      message: 'Registry URL',
      default: registryUrl },

    { name: 'proxy',
      message: 'HTTP proxy',
      default: defaults.proxy },

    { name: 'https-proxy',
      message: 'HTTPS proxy',
      default: defaults['https-proxy'] },

    { name: 'username',
      message: 'User name',
      default: defaults.username },

    { name: 'email',
      message: 'Email',
      default: defaults.email },

    { name: 'always-auth',
      message: 'Always authenticate?',
      type: 'confirm' },

    { name: 'strict-ssl',
      message: 'Check validity of server SSL certificates?',
      type: 'confirm' },
  ];

  console.log('Adding a new configuration %j', name);
  inquirer.prompt(questions, function(answers) {
    var rc = new RegistryConfig(answers);
    storage.store(name, rc);
    console.log('Configuration %j was created.', name);
    console.log('Run `%s use %j` to let the npm client use this registry.',
      $0, name);
  });
};
