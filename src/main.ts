import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  Notice,
  setIcon,
} from "obsidian";

// ─── Settings ────────────────────────────────────────────────────────────────

interface FontSizeSettings {
  fontSize: number;
  step: number;
  minSize: number;
  maxSize: number;
}

const DEFAULT_SETTINGS: FontSizeSettings = {
  fontSize: 16,
  step: 1,
  minSize: 10,
  maxSize: 32,
};

// ─── Plugin ──────────────────────────────────────────────────────────────────

export default class FontSizePlugin extends Plugin {
  settings: FontSizeSettings = DEFAULT_SETTINGS;

  private styleEl: HTMLStyleElement | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Inject a <style> tag we can update at runtime
    this.styleEl = document.createElement("style");
    this.styleEl.id = "font-size-plugin-style";
    document.head.appendChild(this.styleEl);
    this.applyFontSize();

    // ── Commands (palette + hotkeys) ────────────────────────────────────────

    this.addCommand({
      id: "increase-font-size",
      name: "Increase note font size",
      callback: () => this.changeFontSize(+this.settings.step),
    });

    this.addCommand({
      id: "decrease-font-size",
      name: "Decrease note font size",
      callback: () => this.changeFontSize(-this.settings.step),
    });

    this.addCommand({
      id: "reset-font-size",
      name: "Reset note font size to default",
      callback: () => this.resetFontSize(),
    });

    // ── Settings tab ────────────────────────────────────────────────────────

    this.addSettingTab(new FontSizeSettingTab(this.app, this));

    // ── Status bar ──────────────────────────────────────────────────────────

    this.updateStatusBar();
  }

  onunload(): void {
    this.styleEl?.remove();
    this.styleEl = null;
  }

  // ── Core helpers ───────────────────────────────────────────────────────────

  changeFontSize(delta: number): void {
    const next = this.settings.fontSize + delta;

    if (next < this.settings.minSize) {
      new Notice(`Minimum font size reached (${this.settings.minSize}px)`);
      return;
    }
    if (next > this.settings.maxSize) {
      new Notice(`Maximum font size reached (${this.settings.maxSize}px)`);
      return;
    }

    this.settings.fontSize = next;
    this.applyFontSize();
    this.updateStatusBar();
    this.saveSettings();

    new Notice(`Font size: ${next}px`);
  }

  resetFontSize(): void {
    this.settings.fontSize = DEFAULT_SETTINGS.fontSize;
    this.applyFontSize();
    this.updateStatusBar();
    this.saveSettings();
    new Notice(`Font size reset to ${DEFAULT_SETTINGS.fontSize}px`);
  }

  /** Writes CSS that targets the editor and reading view text. */
  applyFontSize(): void {
    if (!this.styleEl) return;

    const px = this.settings.fontSize;

    // Covers Live Preview (CM6) + Reading View + Source Mode
    this.styleEl.textContent = `
      .cm-editor .cm-content,
      .cm-editor .cm-line,
      .markdown-reading-view .markdown-preview-section,
      .markdown-source-view.mod-cm6 .cm-content {
        font-size: ${px}px !important;
        line-height: ${Math.round(px * 1.6)}px !important;
      }
    `;
  }

  // ── Status bar ─────────────────────────────────────────────────────────────

  private statusBarEl: HTMLElement | null = null;
  private statusLabelEl: HTMLElement | null = null;

  updateStatusBar(): void {
    if (!this.statusBarEl) {
      this.statusBarEl = this.addStatusBarItem();
      this.statusBarEl.addClass("font-size-plugin-bar");

      // − button
      const btnDecrease = this.statusBarEl.createEl("div", {
        cls: "font-size-plugin-btn",
        title: "Decrease font size",
      });
      setIcon(btnDecrease, "minus-circle");
      btnDecrease.addEventListener("click", () =>
        this.changeFontSize(-this.settings.step),
      );

      // label
      this.statusLabelEl = this.statusBarEl.createEl("span", {
        cls: "font-size-plugin-label",
      });

      // + button
      const btnIncrease = this.statusBarEl.createEl("div", {
        cls: "font-size-plugin-btn",
        title: "Increase font size",
      });
      setIcon(btnIncrease, "plus-circle");
      btnIncrease.addEventListener("click", () =>
        this.changeFontSize(+this.settings.step),
      );
    }

    if (this.statusLabelEl) {
      this.statusLabelEl.setText(`𝐀 ${this.settings.fontSize}px`);
    }
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

class FontSizeSettingTab extends PluginSettingTab {
  plugin: FontSizePlugin;

  constructor(app: App, plugin: FontSizePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Font Size Plugin" });

    // ── Current size ──────────────────────────────────────────────────────

    new Setting(containerEl)
      .setName("Current font size (px)")
      .setDesc("Live value — also changed by the ribbon buttons and commands.")
      .addSlider((slider) =>
        slider
          .setLimits(
            this.plugin.settings.minSize,
            this.plugin.settings.maxSize,
            1,
          )
          .setValue(this.plugin.settings.fontSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.fontSize = value;
            this.plugin.applyFontSize();
            this.plugin.updateStatusBar();
            await this.plugin.saveSettings();
          }),
      );

    // ── Step size ─────────────────────────────────────────────────────────

    new Setting(containerEl)
      .setName("Step size (px)")
      .setDesc("How many pixels each button press changes the font size.")
      .addSlider((slider) =>
        slider
          .setLimits(1, 8, 1)
          .setValue(this.plugin.settings.step)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.step = value;
            await this.plugin.saveSettings();
          }),
      );

    // ── Min / Max ─────────────────────────────────────────────────────────

    new Setting(containerEl)
      .setName("Minimum font size (px)")
      .addSlider((slider) =>
        slider
          .setLimits(8, 20, 1)
          .setValue(this.plugin.settings.minSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.minSize = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Maximum font size (px)")
      .addSlider((slider) =>
        slider
          .setLimits(18, 64, 1)
          .setValue(this.plugin.settings.maxSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxSize = value;
            await this.plugin.saveSettings();
          }),
      );

    // ── Reset button ──────────────────────────────────────────────────────

    new Setting(containerEl).setName("Reset to defaults").addButton((btn) =>
      btn
        .setButtonText("Reset")
        .setWarning()
        .onClick(async () => {
          this.plugin.settings = { ...DEFAULT_SETTINGS };
          this.plugin.applyFontSize();
          this.plugin.updateStatusBar();
          await this.plugin.saveSettings();
          this.display(); // re-render the tab
        }),
    );
  }
}
