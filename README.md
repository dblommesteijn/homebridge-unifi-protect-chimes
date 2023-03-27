
<p align="center">
  <img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">
</p>


# Homebridge Unifi Protect chimes

This plugin exposes the Unifi-Protect chimes to homebridge. On HomeKit there is a lack of control-types, so I opted to use the Light Brightness to represent the Volume of the Chime. The plugin supports zero or more chimes. Adding chimes works with auto-descovery via the Unifi Protect `proxy/protect/api/chimes` endpoint, basically when credentials and IP are correct, setup is automatic.

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
