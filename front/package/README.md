# RassiniUi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.0.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the library, run:

```bash
ng build rassini-ui
```

This command will compile your project, and the build artifacts will be placed in the `dist/` directory.

### Publishing the Library

Once the project is built, you can publish your library by following these steps:

1. Navigate to the `dist` directory:
   ```bash
   cd dist/rassini-ui
   ```

2. Run the `npm publish` command to publish your library to the npm registry:
   ```bash
   npm publish
   ```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Autenticación Centralizada (Opcional)

A partir de la versión 0.0.6, la librería ofrece un sistema centralizado de autenticación. Este mecanismo es estrictamente **opt-in (opcional)**.

- **provideRassiniAuth() es opcional:** No es necesario llamarlo en el pp.config.ts de aplicaciones existentes.
- **AUTH_CONFIG tiene configuración por defecto:** El token de inyección cuenta con un actory que provee valores nulos si no se configura explícitamente, evitando errores de inyección (NG0201).
- **Compatibilidad hacia atrás (Backward Compatibility):** Los consumidores existentes de RassiniLogin que utilizan sus propios mecanismos de autenticación no requieren ningún cambio para actualizar a las versiones recientes de assini-ui.
