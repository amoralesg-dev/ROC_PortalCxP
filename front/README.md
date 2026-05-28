# Front - ROC Portal CxP

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7.

## Requirements

Before running the project, make sure you have installed:

```bash
node -v
npm -v
```

Recommended versions used for this project:

```txt
Node.js: 24.x
npm: 11.x
```

## Install dependencies

From the `front` directory, run:

```bash
npm install
```

> Note: If `package-lock.json` is in sync with `package.json`, CI/CD should use `npm ci`. For local development, use `npm install`.

## Environment configuration

The project supports multiple environments:

```txt
local -> src/environments/environment.ts
dev   -> src/environments/environment.dev.ts
qa    -> src/environments/environment.qa.ts
prod  -> src/environments/environment.prod.ts
```

Each environment defines the backend API URL used by the Angular application.

Example:

```ts
export const environment = {
  production: false,
  environmentName: 'dev',
  baseUrl: 'http://10.15.1.25:8082/ms-pagos'
};
```

## Development server

### Local environment

This uses:

```txt
src/environments/environment.ts
```

Run:

```bash
npm run start:local
```

Or:

```bash
npm start
```

Once the server is running, open your browser and navigate to:

```txt
http://localhost:4200/
```

The application will automatically reload whenever you modify any of the source files.

### DEV environment

This uses:

```txt
src/environments/environment.dev.ts
```

Run:

```bash
npm run start:dev
```

Open your browser at:

```txt
http://localhost:4200/
```

### QA environment

This uses:

```txt
src/environments/environment.qa.ts
```

Run:

```bash
npm run start:qa
```

Open your browser at:

```txt
http://localhost:4200/
```

## Building

### Local build

This uses:

```txt
src/environments/environment.ts
```

Run:

```bash
npm run build:local
```

### DEV build

This uses:

```txt
src/environments/environment.dev.ts
```

Run:

```bash
npm run build:dev
```

### QA build

This uses:

```txt
src/environments/environment.qa.ts
```

Run:

```bash
npm run build:qa
```

### PROD build

This uses:

```txt
src/environments/environment.prod.ts
```

Run:

```bash
npm run build:prod
```

The build output is generated in:

```txt
dist/front/browser
```

This is the folder that must be published to the web server.

## Manual deployment to IIS

After running the desired build, copy the contents of:

```txt
dist/front/browser
```

To the IIS physical path:

```txt
C:\apps-front\ROC_PortalCxP\current
```

The IIS site must point to:

```txt
C:\apps-front\ROC_PortalCxP\current
```

Expected structure:

```txt
C:\apps-front\ROC_PortalCxP\current
├── index.html
├── main-xxxxx.js
├── styles-xxxxx.css
├── favicon.ico
└── img
```

## Angular routes on IIS

For Angular routes such as `/login`, `/dashboard`, or `/pagos` to work directly in the browser, IIS requires URL Rewrite and a `web.config` file.

The `web.config` file must be placed in:

```txt
C:\apps-front\ROC_PortalCxP\current\web.config
```

Example:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>

    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>

    <rewrite>
      <rules>
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>

    <staticContent>
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />

      <remove fileExtension=".woff" />
      <mimeMap fileExtension=".woff" mimeType="font/woff" />

      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />

      <remove fileExtension=".svg" />
      <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
    </staticContent>

  </system.webServer>
</configuration>
```

## Validate IIS deployment

From the IIS server:

```bash
curl http://localhost:8080
```

From another machine in the network:

```txt
http://10.15.1.24:8080
```

Direct Angular routes should also work:

```txt
http://10.15.1.24:8080/login
```

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
npm test
```

Or:

```bash
ng test
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools.

To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics, such as `components`, `directives`, or `pipes`, run:

```bash
ng generate --help
```

## Useful commands

```bash
npm install
npm run start:local
npm run start:dev
npm run start:qa
npm run build:local
npm run build:dev
npm run build:qa
npm run build:prod
```

## CI/CD notes

For CI/CD pipelines, the recommended install command is:

```bash
npm ci
```

The DEV pipeline should use:

```bash
npm run build:dev
```

The QA pipeline should use:

```bash
npm run build:qa
```

The PROD pipeline should use:

```bash
npm run build:prod
```

The artifact to deploy is:

```txt
dist/front/browser
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.