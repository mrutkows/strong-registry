// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: strong-registry
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

module.exports = function itOnUnix(name, test) {
  // Skip tests that fail due to bug in Windows implementation of Node.js
  // https://github.com/joyent/node/issues/3584
  if (process.platform == 'win32')
    it.skip(name, test);
  else
    it(name, test);
};
