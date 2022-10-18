
<p align="center">
  <img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">
</p>


# Homebridge Unifi Protect chimes

This plugin exposes the Unifi-Protect chimes to homebridge.

## Setup Development Environment

To develop Homebridge plugins you must have Node.js 12 or later installed, and a modern code editor such as [VS Code](https://code.visualstudio.com/). This plugin template uses [TypeScript](https://www.typescriptlang.org/) to make development easier and comes with pre-configured settings for [VS Code](https://code.visualstudio.com/) and ESLint. If you are using VS Code install these extensions:
* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## Install Development Dependencies and Run Locally

Using a terminal, navigate to the project folder and run this command to install the development dependencies:

```
npm install
```

TypeScript needs to be compiled into JavaScript before it can run. The following command will compile the contents of your [`src`](./src) directory and put the resulting code into the `dist` folder.

```
npm run build
```

Run this command so your global install of Homebridge can discover the plugin in your development environment:

```
npm link
```

You can now start Homebridge, use the `-D` flag so you can see debug log messages in your plugin:

```
homebridge -D
```

At this point the plugin should show up in your local Homebridge setup.


## Watch For Changes and Build Automatically (not tested)

If you want to have your code compile automatically as you make changes, and restart Homebridge automatically between changes, you first need to add your plugin as a platform in `~/.homebridge/config.json`:
```
{
...
    "platforms": [
        {
            "name": "Config",
            "port": 8581,
            "platform": "config"
        },
        {
            "name": "<PLUGIN_NAME>",
            //... any other options, as listed in config.schema.json ...
            "platform": "<PLATFORM_NAME>"
        }
    ]
}
```

and then you can run:

```
npm run watch
```

This will launch an instance of Homebridge in debug mode which will restart every time you make a change to the source code. It will load the config stored in the default location under `~/.homebridge`. You may need to stop other running instances of Homebridge while using this command to prevent conflicts. You can adjust the Homebridge startup command in the [`nodemon.json`](./nodemon.json) file.

## Publish Package (not tested)

```
npm publish
```

_NOTE: When you are ready to publish your plugin to [npm](https://www.npmjs.com/), make sure you have removed the `private` attribute from the [`package.json`](./package.json)_

If you are publishing a scoped plugin, i.e. `@username/homebridge-xxx` you will need to add `--access=public` to command the first time you publish.

**Publishing Beta Versions**

```bash
npm version prepatch --preid beta
npm publish --tag=beta
```

_NOTE: Users can then install the  *beta* version by appending `@beta` to the install command_
