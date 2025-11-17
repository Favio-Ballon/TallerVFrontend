# Fronted

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.4.

## Quick start (Windows, cmd.exe)

Follow these steps to get the project running on a Windows machine using the default Command Prompt (cmd.exe).

1. Install Node.js (LTS)

	- Download and install the latest LTS from https://nodejs.org/ (recommended). The installer will include npm.
	- After installation, open a new Command Prompt and verify versions:

```cmd
node --version
npm --version
```

	- Recommended: Node.js 18+ or the latest LTS compatible with Angular CLI 20.x.

2. Install Angular CLI (global)

	- The Angular CLI (`ng`) can be installed globally with npm. In cmd.exe run:

```cmd
npm install -g @angular/cli@20
```

	- If you don't want to install globally, you can use `npx @angular/cli@20 <command>` instead (no global install required).

3. Clone / open the project and install dependencies

	- If you haven't cloned the repository yet, clone it and change into the project folder. Otherwise, open a Command Prompt at the project root (the folder that contains `package.json`).

```cmd
cd \path\to\TallerVFrontend
npm install
```

	- Use `npm ci` on CI machines or when you want a clean, reproducible install from a lockfile.

4. Run the development server

	- Start the dev server with the Angular CLI `ng serve` command (this project also supports `npm start` if configured):

```cmd
ng serve --open
```

	- The `--open` flag will launch your default browser at `http://localhost:4200/`.
	- If you prefer the npm script (if present), you can run:

```cmd
npm start
```

5. Common troubleshooting

	- Permission errors installing global packages: re-run the command in an elevated Command Prompt (Run as Administrator) or use a node version manager (nvm-windows) to manage Node without admin rights.
	- `ng` not found after a global install: close and re-open the Command Prompt so the PATH is refreshed, or use `npx @angular/cli@20 serve`.
	- Build or template errors after code edits: run `ng build` to see full compile errors. Template type errors will be shown in the terminal during `ng serve` as well.
	- Long path issues on Windows: enable long paths (Windows 10+) or try cloning to a shorter path (e.g., `C:\projects\TallerVFrontend`).

6. Recommended dev workflow

	- Use a terminal that supports tabs and better UX, e.g., Windows Terminal, PowerShell, or Git Bash. When using cmd.exe, keep the example commands above.
	- If you work on multiple Node versions, consider installing nvm for Windows: https://github.com/coreybutler/nvm-windows

7. Environment / API

	- The frontend expects a backend API matching the routes used in the app (for example `/auth/me`, `/materia`, `/matriculacion`, `/nota`, etc.). Configure the backend base URL in the appropriate environment file if needed (look under `src/environments/`).

## Development server
## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

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

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

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
