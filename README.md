# strong-registry

CLI tool for switching your npmrc config between different registry servers.

## Implementation overview

On the first run, a directory $HOME/.strong-registry is created to keep
the configuration files.

For each configuration, there is an ini file with the same name as the
configuration name (e.g. `default.ini`). The configuration file keeps
all registry-specific options.

When switching between registries, the npmrc file is modified and all
registry-specific options are replaced with the configured values.
