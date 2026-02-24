# Contributing to Kite Language (VS Code Extension)

Thank you for your interest in contributing. This document provides guidelines for development setup, commit messages, and the pull request process.

## Development setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/b0j3ng4/kite-vscode-extension.git
   cd kite-vscode-extension
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run compile
   ```

4. **Watch mode (for development)**

   ```bash
   npm run watch
   ```

   Then open the project in VS Code and press F5 to launch the Extension Development Host.

## Branch and pull request flow

- Create a branch from `main` for your changes (e.g. `fix/issue-123` or `feat/add-feature`).
- Open a pull request targeting `main`.
- Ensure all CI checks pass (pre-commit, commitlint, test).

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and [commitlint](https://commitlint.js.org/). Commit messages must follow the conventional format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Examples:

- `fix: resolve LSP restart command`
- `feat(syntax): add folding regions`
- `docs: update README installation steps`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, etc.

## Pre-commit hooks

We use [pre-commit](https://pre-commit.com/) to run checks before each commit. Install it and enable the hooks:

```bash
pip install pre-commit
pre-commit install
```

Hooks include: end-of-file fixer, trailing whitespace, YAML/JSON checks, Prettier (JSON, Markdown, YAML), and markdownlint.

## Formatting

- **Prettier** formats JSON, Markdown, and YAML. Run `npm run format` to format, or `npm run format:check` to verify.
- **EditorConfig** ensures consistent indentation and line endings. Your editor should respect `.editorconfig`.

## Questions

Open an issue for questions or discussions.
