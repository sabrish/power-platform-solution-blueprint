# Contributing to Power Platform Solution Blueprint (PPSB)

Thank you for your interest in contributing to PPSB! This document provides guidelines and best practices for contributing to the project.

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages. This leads to **more readable messages** that are easy to follow when looking through the **project history** and enables automatic changelog generation.

### Commit Message Format

Each commit message consists of a **header**, an optional **body**, and an optional **footer**:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

The **header** is mandatory and must conform to the format above.

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies (example scopes: npm, vite, typescript)
- **ci**: Changes to CI configuration files and scripts (example scopes: github-actions, npm-publishing)
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope

The scope should be the name of the affected component or area (as perceived by the person reading the changelog):

- **ui**: UI components and visual changes
- **core**: Core business logic (generators, analyzers, reporters)
- **dataverse**: Dataverse client and API integration
- **discovery**: Component discovery logic
- **export**: Export functionality (markdown, JSON, HTML)
- **scope-selector**: Scope selection component
- **blueprint**: Blueprint generation
- **deps**: Dependencies

### Description

The description contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end

### Body

The body should include the motivation for the change and contrast this with previous behavior.

### Footer

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for this.

### Examples

#### Feature commit with scope

```
feat(ui): add dark mode support

Implements dark mode using Fluent UI theme provider.
Automatically detects system theme preference.

Closes #14
```

#### Bug fix commit

```
fix(ui): prevent table column overflow

- Truncate long text with ellipsis
- Show full text on hover
- Enable column resizing

Closes #17
```

#### Documentation commit

```
docs: add conventional commits guide

Create CONTRIBUTING.md with commit message conventions
and development workflow guidelines.
```

#### Breaking change

```
feat(core)!: change blueprint generation API

BREAKING CHANGE: BlueprintGenerator.generate() now returns Promise<Blueprint>
instead of Blueprint. Update all callers to use await.
```

## Before You Start — Open an Issue First

If you want to contribute a new feature or a non-trivial change, **please open a GitHub issue before writing any code**.

This matters for a few reasons:

- **Avoid duplicate work** — someone else may already be working on the same thing
- **Confirm it fits the roadmap** — not every idea is the right fit for PPSB at this stage, and a quick discussion saves you time
- **Shape the design early** — the maintainer may have context on constraints (API limits, PPTB Desktop compatibility, existing patterns) that affects how something should be built
- **Reserve the feature** — once an issue is open and acknowledged, other contributors know it's taken

### How to open a feature issue

1. Go to [GitHub Issues](https://github.com/sabrish/power-platform-solution-blueprint/issues)
2. Click **New issue**
3. Describe what you want to build and why it would be useful — a sentence or two is fine
4. Wait for a response before investing significant time in implementation

For **bug fixes** and small improvements (typos, docs, obvious defects), you can skip the issue and go straight to a PR.

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make changes** following the project's coding standards

3. **Test your changes** in PPTB Desktop before committing

4. **Commit with conventional format**:
   ```bash
   git commit -m "feat(ui): add new component"
   ```

5. **Push and create a pull request**:
   ```bash
   git push origin feat/your-feature-name
   ```

## Coding Standards

- **TypeScript**: Use strict mode, prefer types over interfaces where appropriate
- **React**: Functional components with hooks
- **Fluent UI**: Use Fluent UI v9 components consistently
- **Performance**: Follow patterns in `DATAVERSE_OPTIMIZATION_GUIDE.md`
- **Naming**: Use descriptive names, avoid abbreviations unless well-known

### Interface Naming Convention

Use the `I` prefix **only** for true interface contracts used in dependency inversion:
- `IDataverseClient` — injected into classes that call Dataverse
- `IDiscoverer<T>` — polymorphic discovery interface

Do **not** use the `I` prefix on:
- Hook return shapes (e.g. `UseBlueprintResult`, not `IUseBlueprintResult`)
- Type aliases or DTOs
- Props interfaces (e.g. `ScopeSelectorProps`, not `IScopeSelectorProps`)

## File Organisation

**One file, one job.**

Before adding code to an existing file, ask: *does this belong here?*

- A React component file contains **one component**. Sub-components each get their own file.
- A hook file contains **one hook**.
- Utility functions that could be reused elsewhere live in `src/core/utils/` or `src/hooks/`, not inside the file that first needed them.
- A discovery class discovers one component type. A parser parses one thing.
- **Exception:** When the output format requires a single file (e.g. the HTML export is one `.html` file), the TypeScript that generates it may contain all the pieces inline. That is intentional, not bundling. The HTML export loads Mermaid and Cytoscape from a pinned, SRI-verified jsDelivr CDN, so it is not zero-dependency (see `src/core/reporters/html/HtmlTemplates.ts`).

**The test:** if you have to describe what a file does using the word "and", it probably needs to be split.

## Testing

Before committing:

1. Type check: `pnpm typecheck`
2. Build the project: `pnpm build`
3. Run the unit tests: `pnpm test` (Vitest, `vitest run`)
4. Test in PPTB Desktop with a real Dataverse connection (see below)
5. Verify all features work as expected

### Testing in PPTB Desktop

`pnpm dev` runs Vite in a browser. The PPTB APIs (`window.toolboxAPI`, `window.dataverseAPI`) are not present there, so the tool cannot connect to Dataverse. Test real behaviour in PPTB Desktop.

1. Open **Settings** (gear icon) and turn on **Show Debug Menu**. Click **Save**.
2. Run `pnpm build` in the project.
3. Open **Debug** > **Load Local Tool**. Browse to the **project root** (the folder that contains `package.json`), not `dist/`. Click **Load Tool**.
4. There is no hot reload. After each rebuild, close the tool tab and load the tool again.
5. To see console output, open **Help** > **Toggle Tool DevTools**. Reopen DevTools after each reload.

Notes:

- A locally loaded tool has the id `local-<name>`.
- Removing a local tool removes only its registration in Desktop. Your source files are not touched.
- The Debug **Install Package** box runs npm (`install-tool`). On Windows with current Node and Electron versions it can fail with `spawn EINVAL`, because Desktop spawns `npm.cmd` and `pnpm.cmd` without a shell. This is a PPTB Desktop bug (reported, not independently verified). Use **Load Local Tool** or install from the PPTB Marketplace instead.
- A console message about a CORS error on the icon is expected for locally loaded tools. Desktop loads the SVG icon as a CSS mask over `pptb-webview://`. It is harmless.
- Before reinstalling a tool, remove the old installed or loaded copies first. Installed tools are stored under Desktop's userData directory. The exact folder name per OS is not verified here: verify locally before deleting anything.

For the criteria a tool must meet to keep PPTB's **Verified** status, see [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Pull Request Process

1. Update documentation (README.md, user-guide.md) if needed
2. Update CHANGELOG.md with your changes
3. Ensure all checks pass
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

## Questions?

- Open a [GitHub Discussion](https://github.com/sabrish/power-platform-solution-blueprint/discussions)
- Check existing [documentation](docs/)
- Review [GitHub Issues](https://github.com/sabrish/power-platform-solution-blueprint/issues)

Thank you for contributing! 🙏
