var spawn = require('child_process').spawn;

module.exports = function spawnNpmLogin() {
  var file, args;
  var options = {
    env: process.env,
    stdio: 'inherit'
  };

  if (process.platform == 'win32') {
    file = 'cmd.exe';
    args = ['/s', '/c', '"npm login"'];
    options.windowsVerbatimArguments = true;
  } else {
    file = 'npm';
    args = ['login'];
  }

  return spawn(file, args, options);
};
