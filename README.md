# ocis-app-tokens
This plugin for ownCloud Infinite Scale enables a UI to create and manage app tokens, which enable third-party apps to connect to Infinite Scale.

<img width="2160" height="1620" alt="screenshot of application showing the visual display" src="https://github.com/user-attachments/assets/e3127d65-ce30-47e5-8e4f-7e1b2004075d" />

## Getting Started

This plugin requires as a prerequisite that the [Auth App Service](https://doc.owncloud.com/ocis/next/deployment/services/s-list/auth-app.html) is enabled and properly configured. This is done already for the included docker containers, refer to [docker-compose.yml](./docker-compose.yml) for configuration variables.

To deploy to your server, download the zip file for the latest release and extract it to your OCIS instance's `apps` folder. This folder is configurable through the `WEB_ASSET_APPS_PATH` environment variable and by default is set to `$OCIS_BASE_DATA_PATH/web/assets/apps`.

For example, if `WEB_ASSET_APPS_PATH` is set to `/web/apps` then this app should be installed at `/web/apps/ocis-app-tokens`.

### Enabling custom labels (exclusive to OCIS >= 7.3.0)

The `ocis-app-tokens.config.enableCustomLabels` config value must be set to `true` to allow setting custom labels.

One way to do this is to create `/etc/ocis/apps.yaml` with the contents:
```yaml
ocis-app-tokens:
  config:
    enableCustomLabels: true
```

See [the official documentation](https://owncloud.dev/ocis/config/) for more details about configuring OCIS.

## Development Environment
The following instructions will help you to set up the proper development environment.

Currently local development requires docker and is only supported on Linux and macOS.

To get started, clone the repository and follow the instructions below.

1. Make sure you have a working docker and docker compose environment running.
2. Install [pnpm](https://pnpm.io/installation) if you haven't already. 
   > **Correct version:** Our `package.json` holds a `packageManager` field. Please make sure that you have at least the same major version of pnpm installed.

   > **Corepack:** We recommend to use [pnpm with corepack](https://pnpm.io/installation#using-corepack) to handle the pnpm version automatically.
3. Install dependencies and run a first build process by running:
   ```bash
   pnpm install && pnpm build:w
   ```
   In case you see errors about failed commands (such as Command "vite" not found) try to re-run the pnpm command.
4. Add `127.0.0.1 host.docker.internal` to your `/etc/hosts` file to make sure the address host.docker.internal can be resolved locally. 
5. Start the development server:
   ```bash
   docker compose up
   ```
6. Open your browser and navigate to `https://host.docker.internal:9200` to see your oCIS dev environment. The default user is `admin` with password `admin`. Your app from this directory is automatically loaded.

### Developing The App
You can work on the app by modifying the files in the `src` folder. The development server will automatically reload your changes as long as you keep a running process of `pnpm build:w`. In this setup you currently need a page reload to see your changes.

More details and examples about app/extension development are available in the [developer documentation](https://owncloud.dev/clients/web/extension-system/).

### Testing
This repo holds the basic setup for unit testing with [vitest](https://vitest.dev/guide/). You can run the tests with:
```bash
pnpm test:unit
```
The test files are located in the `tests/unit` folder.

In case you want to set up e2e tests with [playwright](https://playwright.io), you can see working examples in the official OCIS repos [web](https://github.com/owncloud/web) and [web-extensions](https://github.com/owncloud/web-extensions).

### Build For Production
Running `pnpm build` will create a production build in the `dist` folder. It also copies over all static assets placed in the `public` folder. You can then deploy the contents of the `dist` folder to your production environment, see [app deployment](https://owncloud.dev/services/web/#web-apps).
