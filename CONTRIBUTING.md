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

## Testing

Before committing:

1. Build the project: `pnpm build`
2. Type check: `pnpm typecheck`
3. Test in PPTB Desktop with a real Dataverse connection
4. Verify all features work as expected

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
