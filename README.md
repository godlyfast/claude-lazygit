# claude-lazygit

AI-powered commit message generator using Claude Code CLI. A variant of [bunnai](https://github.com/chhoumann/bunnai) that uses Claude instead of OpenAI.

## Features

- **Zero config** - Uses Claude Code CLI's existing authentication
- **Interactive UI** - Beautiful terminal selection interface
- **Conventional commits** - Generates messages following the conventional commits format
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

### Generate commit messages

```bash
# Stage your changes first
git add .

# Generate commit messages
claude-lazygit

# Options
claude-lazygit -n 10      # Generate 10 suggestions (default: 5)
claude-lazygit --verbose  # Enable verbose output
```

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
2. Invokes Claude Code CLI with a structured JSON schema
3. Parses the response to extract commit message suggestions
4. Presents an interactive selection menu
5. Outputs the selected message

## Commands

| Command | Description |
|---------|-------------|
| `claude-lazygit` | Generate commit messages for staged changes |
| `claude-lazygit setup` | Configure lazygit integration (interactive) |
| `claude-lazygit setup -y` | Configure lazygit without confirmation |
| `claude-lazygit --help` | Show help |

## Options

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--count` | `-n` | 5 | Number of commit suggestions |
| `--verbose` | `-v` | false | Enable verbose output |

## License

MIT
