# MADAME App

Model Assessment and Decision Analysis for Marine Environments web application.
Prototype Decision Support app for the [ADRIA.jl](https://github.com/open-AIMS/ADRIA.jl)
platform and CoralBlox model. This project also contains the Reef Guide app.

## Table of Contents
- [Quick Start](#quick-start)
- [Angular Developer Setup](#angular-developer-setup)
- [Development Server](#development-server)
- [ReefGuide Web API Integration](#reefguide-web-api-integration)
- [Code Scaffolding](#code-scaffolding)
- [Configuration](#configuration)
- [Build](#build)
- [Deploy](#deploy)
- [Testing](#testing)
- [Further Help](#further-help)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/open-AIMS/MADAME-app.git
cd MADAME-app

# For Linux: Install Node with NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Install global tools
npm install -g @angular/cli
npm install -g pnpm

# Install dependencies
npm install --legacy-peer-deps

# Start development server
ng serve

# Access the application at http://localhost:4200/
```

## Angular Developer Setup

This project was generated with [Angular CLI](https://github.com/angular/angular-cli)
version 18.0.6.

**One-time setup:**
1. Install [Node v22](https://nodejs.org/en/download/package-manager)\
   In a Linux environment consider using [Node Version Manager](https://github.com/nvm-sh/nvm):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   source ~/.bashrc
   nvm install 22
   nvm use 22
   ```

2. Install Angular CLI globally:
   ```bash
   npm install -g @angular/cli
   ```

3. Install project dependencies:
   ```bash
   pnpm install --legacy-peer-deps
   ```

**Note:** *--legacy-peer-deps* will be necessary until ArcGIS updates peer deps to Angular 18.

A script security error may be raised if using PowerShell.
If this occurs, run the following to [fix Powershell execution policy](https://angular.dev/tools/cli/setup-local#powershell-execution-policy):

```shell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.
The application will automatically reload if you change any of the source files.

The APIs are proxied to avoid CSRF issues; see [proxy.conf.json](src/proxy.conf.json)

## ReefGuide Web API Integration

A working ReefGuide Web API instance is required to use the application.

**Option 1: Use existing API instance**
- Configure the `webApiUrl` in the environment file to point to your API instance

**Option 2: Set up local API instance**
1. Clone the ReefGuide Web API repository:
   ```bash
   git clone https://github.com/open-AIMS/reefguide-web-api.git
   ```
2. Follow the setup instructions in the repository README
3. Update the `webApiUrl` in your environment configuration

The `webApiUrl` entry in the configuration file needs to point to this, or an alternate,
API instance. See the *Configuration* section.

## Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Configuration

The environment pattern is used for configuration:

- **Development**: [environment.development.ts](src/environments/environment.development.ts)
- **Production**: [environment.ts](src/environments/environment.ts)

The APIs are proxied by the local dev server to avoid CORS issues, see [proxy.conf.json](src/proxy.conf.json).

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/`
directory.

## Deploy

After the **Build** step:

1. Navigate to the build output:
   ```bash
   cd dist/adria-app/browser
   ```

2. Sync to AWS S3 bucket:
   ```bash
   aws s3 sync . s3://BUCKET_NAME --delete
   ```

(This assumes you have [configured your AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html))

## Testing

### Unit Tests
Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### End-to-End Tests
Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this
command, you need to first add a package that implements end-to-end testing capabilities.

## Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.