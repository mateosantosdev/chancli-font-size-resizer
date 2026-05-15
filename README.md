# Obsidian Font Size Plugin

Adds two ribbon buttons to instantly increase or decrease the note editor font size — no settings menu required.

## Features

- **➕ Increase** and **➖ Decrease** ribbon buttons
- Works in Live Preview, Reading View, and Source Mode
- Persists your chosen size across Obsidian restarts
- Status bar shows the current size at a glance (`𝐀 18px`)
- Command palette commands + hotkey support
- Settings tab to fine-tune step size, min/max bounds, and reset

## Installation

### Manual (recommended for development)

1. Build the plugin (see below).
2. Copy `main.js`, `manifest.json`, and `styles.css` into:
   ```
   <your-vault>/.obsidian/plugins/font-size-plugin/
   ```
3. In Obsidian → Settings → Community Plugins, enable **Font Size**.

### Development build

```bash
npm install
npm run build      # production build → dist/main.js
npm run dev        # watch mode
```

## Usage

| Action | How |
|--------|-----|
| Increase font | Click **＋** ribbon button |
| Decrease font | Click **－** ribbon button |
| Increase font | Command palette → *Increase note font size* |
| Decrease font | Command palette → *Decrease note font size* |
| Reset to 16px | Command palette → *Reset note font size to default* |
| Fine-tune | Settings → Font Size |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Current font size | 16 px | Live slider — synced with buttons |
| Step size | 1 px | Pixels changed per button press |
| Minimum size | 10 px | Lower bound (prevents invisible text) |
| Maximum size | 32 px | Upper bound |

## Project Structure

```
obsidian-font-size-plugin/
├── src/
│   └── main.ts          # Plugin source (TypeScript)
├── esbuild.config.mjs   # Bundler config
├── manifest.json        # Obsidian plugin manifest
├── package.json
├── styles.css
├── tsconfig.json
└── versions.json
```

## License

MIT
