# ocis-app-tokens
This plugin for ownCloud Infinite Scale enables a UI to create and manage app tokens, which enable third-party apps to connect to Infinite Scale.

![screenshot](https://github.com/user-attachments/assets/12dafb58-5b70-47e0-ba97-589535e7cfd4)

## Getting Started
The following instructions will help you to set up the proper development environment.

To get started, clone the repository and follow the instructions below.

This plugin requires as a prerequisite that the [Auth App Service](https://doc.owncloud.com/ocis/next/deployment/services/s-list/auth-app.html) is enabled and properly configured. This is done already for the included docker containers, refer to [docker-compose.yml](./docker-compose.yml) for configuration variables.

### Development Environment

Currently local development requires docker and is only supported on Linux and macOS.

1. Make sure you have a working docker- and docker compose environment running.
1. Install [pnpm](https://pnpm.io/installation) if you haven't already. 
   > **Correct version:** Our `package.json` holds a `packageManager` field. Please make sure that you have at least the same major version of pnpm installed.

   > **Corepack:** We recommend to use [pnpm with corepack](https://pnpm.io/installation#using-corepack) to handle the pnpm version automatically.  
1. Install dependencies and run a first build process by running:
   ```bash
   pnpm install && pnpm build:w
   ```
   In case you see errors about failed commands (such as Command "vite" not found) try to re-run the pnpm command.
1. Add `127.0.0.1 host.docker.internal` to your `/etc/hosts` file to make sure the address host.docker.internal can be resolved locally. 
1. Start the development server:
   ```bash
   docker compose up
   ```
1. Open your browser and navigate to `https://host.docker.internal:9200` to see your oCIS dev environment. The default user is `admin` with password `admin`. Your app from this directory is automatically loaded.

### Developing The App
You can work on the app by modifying the files in the `src` folder. The development server will automatically reload your changes as long as you keep a running process of `pnpm build:w`. In this setup you currently need a page reload to see your changes.

More details and examples about app/extension development are available in the [developer documentation](https://owncloud.dev/clients/web/extension-system/).

### Testing
This repo holds the basic setup for unit testing with [vitest](https://vitest.dev/guide/). You can run the tests with:
```bash
pnpm test:unit
```
The test files are located in the `tests/unit` folder.

In case you want to set up e2e tests with [playwright](https://playwright.io), you can see working examples in our repos [web](https://github.com/owncloud/web) and [web-extensions](https://github.com/owncloud/web-extensions).

### Build For Production
Running `pnpm build` will create a production build of your app in the `dist` folder. It also copies over all static assets placed in the `public` folder. You can then deploy the contents of the `dist` folder to your production environment, see [app deployment](https://owncloud.dev/services/web/#web-apps).

## Publish
We'd be happy to see your app in our [awesome-ocis list](https://github.com/owncloud/awesome-ocis/blob/main/README.md). Feel free to make a pull request to the README.md file to add your app.
If you feel that your app has reached a sufficient level of maturity and you want to publish it, please follow our [publishing guide](https://github.com/owncloud/awesome-ocis/tree/main/webApps).
