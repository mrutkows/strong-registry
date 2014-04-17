# strong-registry

CLI tool for switching your npmrc config between different registry servers.

## Quick start

```
$ npm install -g strong-cli
$ slc registry
```

## Documentation

See the official [strong-cli documentation](http://docs.strongloop.com/display/DOC/slc+registry)
for detailed usage instructions.

## Implementation overview

On the first run, a directory $HOME/.strong-registry is created to keep
the configuration files.

For each configuration, there is an ini file with the same name as the
configuration name (e.g. `default.ini`). The configuration file keeps
all registry-specific options.

When switching between registries, the npmrc file is modified and all
registry-specific options are replaced with the configured values.
