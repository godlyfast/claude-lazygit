# claude-lazygit

<!--toc:start-->

- [claude-lazygit](#claude-lazygit)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [From source](#from-source)
  - [Usage](#usage)
    - [Generate commit messages](#generate-commit-messages)
    - [Setup lazygit integration](#setup-lazygit-integration)
  - [Manual Lazygit Configuration](#manual-lazygit-configuration)
  - [How it Works](#how-it-works)
  - [Commands](#commands)
  - [Options](#options)
  - [License](#license)
  <!--toc:end-->

AI-powered commit message generator using Claude Code CLI. A variant of [bunnai](https://github.com/chhoumann/bunnai) that uses Claude instead of OpenAI.

## Features

- **Zero config** - Uses Claude Code CLI's existing authentication
- **High-quality output** - Generates one focused commit message with option to regenerate
- **Conventional commits** - Follows the Conventional Commits specification
- **Lazygit integration** - One-command setup for lazygit custom commands

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- [Claude Code CLI](https://claude.ai/code) installed and authenticated

## Installation

```bash
# Install globally from npm
npm install -g claude-lazygit

# Or with bun
bun install -g claude-lazygit
```

### From source

```bash
git clone https://github.com/yourusername/claude-lazygit.git
cd claude-lazygit
bun install
bun run build
npm link
```

## Usage

### Generate commit message

```bash
# Stage your changes first
git add .

# Generate commit message
claude-lazygit

# Options
claude-lazygit --verbose  # Enable verbose output
```

The tool generates one high-quality commit message. You can then:
- **Accept** - Use the message
- **Regenerate** - Generate a new message
- **Cancel** - Exit without committing

### Setup lazygit integration

```bash
# Automatically configure lazygit (interactive)
claude-lazygit setup

# Skip confirmation prompt
claude-lazygit setup -y
```

This adds a custom command to lazygit. Press `Ctrl+A` in the files panel to generate AI commit messages.

## Manual Lazygit Configuration

If you prefer to configure manually, add to `~/.config/lazygit/config.yml`:

```yaml
customCommands:
  - key: "<c-a>"
    description: "Generate AI commit message"
    context: "files"
    command: "claude-lazygit"
    subprocess: true
```

## How it Works

1. Gets the staged diff using `git diff --cached`
2. Sends diff to Claude Code CLI with optimized prompt for conventional commits
3. Displays the generated commit message
4. Allows accept, regenerate, or cancel
5. Outputs the accepted message to stdout

## Commands

| Command                   | Description                                 |
| ------------------------- | ------------------------------------------- |
| `claude-lazygit`          | Generate commit messages for staged changes |
| `claude-lazygit setup`    | Configure lazygit integration (interactive) |
| `claude-lazygit setup -y` | Configure lazygit without confirmation      |
| `claude-lazygit --help`   | Show help                                   |

## Options

| Option      | Alias | Default | Description           |
| ----------- | ----- | ------- | --------------------- |
| `--verbose` | `-v`  | false   | Enable verbose output |

## License

MIT
