const palettes = {
  dark: { background: "#101114", surface: "#18191D", surface2: "#24262C", white: "#F7F3EA", muted: "#A9A69F", accent: "#D9A441", success: "#9AD6B4", danger: "#E98B7F", line: "#FFFFFF" },
  light: { background: "#F4F1E9", surface: "#FFFFFF", surface2: "#EAE6DC", white: "#1A1B1F", muted: "#6D6B65", accent: "#A87518", success: "#397C56", danger: "#A54238", line: "#1A1B1F" }
};

const DesignSystem = {
  version: "1.0.0",
  palettes,
  typography: { header: 17, title: 18, body: 13, caption: 11, micro: 10 },
  layout: { pagePadding: 16, cardRadius: 18, cardPadding: 14, gap: 8 },
  normalizeThemeMode(mode) { return mode === "light" ? "light" : "dark"; },
  resolveThemeMode(mode, isDarkAppearance) { return mode === "auto" ? (isDarkAppearance ? "dark" : "light") : this.normalizeThemeMode(mode); },
  resolvePalette(mode = "dark", isDarkAppearance = true) { return this.palettes[this.resolveThemeMode(mode, isDarkAppearance)]; },
  applyCardBackground(widget, palette) { widget.backgroundColor = new Color(palette.background); return widget; },
  colors: { ink: new Color("#F7F3EA"), muted: new Color("#A9A69F"), accent: new Color("#D9A441"), accentSoft: new Color("#6B5326"), surface: new Color("#18191D", 0.92), surface2: new Color("#24262C", 0.88), line: new Color("#FFFFFF", 0.10), success: new Color("#9AD6B4"), danger: new Color("#E98B7F") },
  font(size, weight) { return weight === "bold" ? Font.boldSystemFont(size) : weight === "semibold" ? Font.semiboldSystemFont(size) : Font.systemFont(size); },
  setPadding(stack, top, right, bottom, left) { stack.setPadding(top, right, bottom, left); return stack; },
  card(parent, radius = 18) { const stack = parent.addStack(); stack.backgroundColor = this.colors.surface2; stack.cornerRadius = radius; stack.layoutVertically(); return stack; },
  label(parent, value, size = 13, color = this.colors.ink, weight = "regular") { const text = parent.addText(String(value)); text.font = this.font(size, weight); text.textColor = color; text.lineLimit = 1; return text; },
  progress(parent, value, max, color = this.colors.accent) { const track = parent.addStack(); track.backgroundColor = new Color("#FFFFFF", 0.10); track.cornerRadius = 4; track.heightAnchor.constraintEqualToConstant(7).isActive = true; const fill = track.addStack(); fill.backgroundColor = color; fill.cornerRadius = 4; fill.widthAnchor.constraintEqualToConstant(Math.max(4, 210 * Math.min(1, value / Math.max(1, max)))).isActive = true; track.addSpacer(); return track; },
  badge(parent, value, color = this.colors.accent) { const badge = parent.addStack(); badge.backgroundColor = color === this.colors.accent ? new Color("#D9A441", 0.16) : new Color("#FFFFFF", 0.10); badge.cornerRadius = 8; badge.setPadding(4, 7, 4, 7); this.label(badge, value, 11, color, "semibold"); return badge; }
};

module.exports = DesignSystem;
