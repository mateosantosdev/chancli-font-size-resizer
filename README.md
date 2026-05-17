# Obsidian Font Size Plugin

Increase or decrease the note editor font size from the status bar. Headers scale proportionally; body text scales independently.

Works in Live Preview, Reading View, and Source Mode. Size persists across restarts.

## Usage

- **Status bar** — click `−` / `+` buttons next to the `𝐀 16px` indicator
- **Command palette** — *Increase / Decrease / Reset note font size*
- **Settings tab** — adjust step size, min/max bounds, or drag the live slider

## Settings

| Setting | Default |
|---------|---------|
| Font size | 16 px |
| Step size | 1 px |
| Minimum | 10 px |
| Maximum | 32 px |

## Installation

1. Run `npm install && npm run build`
2. Copy `dist/main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/chancli-font-size-resizer/`
3. Enable the plugin in Settings → Community Plugins

## License

MIT
