import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  Notice,
  setIcon,
  SliderComponent,
} from "obsidian";

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

export default class FontSizePlugin extends Plugin {
  settings: FontSizeSettings = DEFAULT_SETTINGS;

  private styleEl: HTMLStyleElement | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.styleEl = document.createElement("style");
    this.styleEl.id = "font-size-plugin-style";
    document.head.appendChild(this.styleEl);
    this.applyFontSize();

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

    this.addSettingTab(new FontSizeSettingTab(this.app, this));
    this.updateStatusBar();
  }

  onunload(): void {
    this.styleEl?.remove();
    this.styleEl = null;
  }

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

  applyFontSize(): void {
    if (!this.styleEl) return;

    const px = this.settings.fontSize;
    const headingLineHeight = (ratio: number) => Math.round(px * ratio * 1.3);

    const HEADING_RATIOS = [2.0, 1.5, 1.25, 1.125, 1.0, 0.875];

    const headingCss = HEADING_RATIOS.map((ratio, i) => {
      const level = i + 1;
      const headingFontSize = Math.round(px * ratio);
      const calcLineHeight = headingLineHeight(ratio);
      return `
      .cm-editor .cm-line.HyperMD-header-${level} { font-size: ${headingFontSize}px !important; line-height: ${calcLineHeight}px !important; }
      .markdown-reading-view .markdown-preview-section h${level} { font-size: ${headingFontSize}px !important; line-height: ${calcLineHeight}px !important; }`;
    }).join("");

    this.styleEl.textContent = `
      .cm-editor .cm-content,
      .cm-editor .cm-line,
      .markdown-reading-view .markdown-preview-section,
      .markdown-source-view.mod-cm6 .cm-content {
        font-size: ${px}px !important;
        line-height: ${Math.round(px * 1.6)}px !important;
      }
      ${headingCss}
    `;
  }

  private statusBarEl: HTMLElement | null = null;
  private statusLabelEl: HTMLElement | null = null;

  updateStatusBar(): void {
    if (!this.statusBarEl) {
      this.statusBarEl = this.addStatusBarItem();
      this.statusBarEl.addClass("font-size-plugin-bar");

      const btnDecrease = this.statusBarEl.createEl("div", {
        cls: "font-size-plugin-btn",
        title: "Decrease font size",
      });
      setIcon(btnDecrease, "minus-circle");
      btnDecrease.addEventListener("click", () =>
        this.changeFontSize(-this.settings.step),
      );

      this.statusLabelEl = this.statusBarEl.createEl("span", {
        cls: "font-size-plugin-label",
      });

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

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

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

    let minSlider!: SliderComponent;
    let maxSlider!: SliderComponent;

    new Setting(containerEl)
      .setName("Minimum font size (px)")
      .addSlider((slider) => {
        minSlider = slider;
        slider
          .setLimits(8, 20, 1)
          .setValue(this.plugin.settings.minSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.minSize = value;
            if (value >= this.plugin.settings.maxSize) {
              this.plugin.settings.maxSize = value + 1;
              maxSlider.setValue(value + 1);
            }
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Maximum font size (px)")
      .addSlider((slider) => {
        maxSlider = slider;
        slider
          .setLimits(18, 64, 1)
          .setValue(this.plugin.settings.maxSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxSize = value;
            if (value <= this.plugin.settings.minSize) {
              this.plugin.settings.minSize = value - 1;
              minSlider.setValue(value - 1);
            }
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl).setName("Reset to defaults").addButton((btn) =>
      btn
        .setButtonText("Reset")
        .setWarning()
        .onClick(async () => {
          this.plugin.settings = { ...DEFAULT_SETTINGS };
          this.plugin.applyFontSize();
          this.plugin.updateStatusBar();
          await this.plugin.saveSettings();
          this.display();
        }),
    );
  }
}
