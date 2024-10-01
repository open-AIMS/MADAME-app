# MADAME App

Model Assessment and Decision Analysis for Marine Environments web application.
Prototype Decision Support app for the [ADRIA.jl](https://github.com/open-AIMS/ADRIA.jl)
platform and CoralBlox model. This project also contains the Reef Guide app.

## Angular Developer Setup

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.6.

**One-time setup:**
1. Install [Node v22](https://nodejs.org/en/download/package-manager)  
  In a Linux environment consider using [Node Version Manager](https://github.com/nvm-sh/nvm).
2. `npm install -g @angular/cli`
3. `npm install`

If you encounter a PowerShell script security error,
[fix Powershell execution policy](https://angular.dev/tools/cli/setup-local#powershell-execution-policy).

*--legacy-peer-deps* will be necessary until ArcGIS updates peer deps to Angular 18.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

The APIs are proxied to avoid CSRF issues; see [proxy.conf.json](src/proxy.conf.json)

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Configuration

The environment pattern is used for configuration. During development, [environment.development.ts](src/environments/environment.development.ts) is used. The APIs are proxied by the local dev server to avoid CORS issues, see [proxy.conf.json](src/proxy.conf.json)

The production build uses [environment.ts](src/environments/environment.ts).

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Deploy

After the **Build** step:
1. `cd dist/adria-app/browser`
2. `aws s3 sync . s3://BUCKET_NAME --delete`

(This assumes you have [configured your AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html))

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
