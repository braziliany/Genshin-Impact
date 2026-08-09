// 原神 · LPL Design System widget for Scriptable

let DesignSystem;
try {
  DesignSystem = importModule("LPL-Design-System");
} catch (error) {
  throw new Error("缺少 LPL-Design-System，请先运行 LPL Schedule 最新安装器。");
}

const theme = DesignSystem.resolvePalette("dark");
const typography = DesignSystem.typography;
const layout = DesignSystem.layout;
const type = { header: typography.header, title: typography.valueCompact, body: typography.subtitle, caption: typography.subtitleCompact, micro: 10 };
const spacing = { pagePadding: layout.headerGap + 6, cardRadius: 18, cardPadding: 14, gap: layout.headerGap - 2 };
const UI = {
  colors: {
    ink: new Color(theme.white), muted: new Color(theme.muted), accent: new Color(theme.yellow),
    success: new Color("#9AD6B4"), danger: new Color(theme.red), surface: new Color(theme.backgroundBottom, 0.92),
    surface2: new Color(theme.backgroundTop, 0.70)
  },
  font(size, weight) { return weight === "bold" ? Font.boldSystemFont(size) : weight === "semibold" ? Font.semiboldSystemFont(size) : Font.systemFont(size); },
  setPadding(stack, top, right, bottom, left) { stack.setPadding(top, right, bottom, left); return stack; },
  card(parent, radius = spacing.cardRadius) { const s = parent.addStack(); s.backgroundColor = this.colors.surface2; s.cornerRadius = radius; s.layoutVertically(); return s; },
  label(parent, value, size, color, weight = "regular") { const t = parent.addText(String(value)); t.font = this.font(size, weight); t.textColor = color; t.lineLimit = 1; return t; },
  progress(parent, value, max, color = this.colors.accent) { const track = parent.addStack(); track.backgroundColor = new Color(theme.divider, 0.12); track.cornerRadius = 4; track.size = new Size(210, 7); const fill = track.addStack(); fill.backgroundColor = color; fill.cornerRadius = 4; fill.size = new Size(Math.max(4, 210 * Math.min(1, value / Math.max(1, max))), 7); track.addSpacer(); },
  badge(parent, value, color = this.colors.accent) { const badge = parent.addStack(); badge.backgroundColor = new Color(theme.yellow, 0.16); badge.cornerRadius = 8; badge.setPadding(4, 7, 4, 7); this.label(badge, value, type.micro + 1, color, "semibold"); }
};

const STORE = "genshin-lpl-widget";
const CACHE_KEY = STORE + ".cache";
const CONFIG_KEY = STORE + ".config";
const COOKIE_KEY = STORE + ".cookie";
const DEFAULT = { server: "os_asia", roleId: "", nickname: "旅行者" };

async function readConfig() {
  const raw = Keychain.contains(CONFIG_KEY) ? Keychain.get(CONFIG_KEY) : "";
  try { return Object.assign({}, DEFAULT, raw ? JSON.parse(raw) : {}); }
  catch (_) { return Object.assign({}, DEFAULT); }
}

async function setup() {
  const cfg = await readConfig();
  const alert = new Alert();
  alert.title = "原神组件设置";
  alert.message = "Cookie 只保存在本机 Keychain。请输入 HoYoLAB Cookie、角色 UID 和昵称。";
  alert.addTextField("Cookie（ltuid_v2=...; ltoken_v2=...）", Keychain.contains(COOKIE_KEY) ? Keychain.get(COOKIE_KEY) : "");
  alert.addTextField("角色 UID", cfg.roleId);
  alert.addTextField("显示昵称", cfg.nickname);
  alert.addAction("保存");
  alert.addCancelAction("稍后设置");
  if (await alert.present() === -1) return cfg;
  const cookie = alert.textFieldValue(0).trim();
  cfg.roleId = alert.textFieldValue(1).trim();
  cfg.nickname = alert.textFieldValue(2).trim() || "旅行者";
  if (cookie) Keychain.set(COOKIE_KEY, cookie);
  Keychain.set(CONFIG_KEY, JSON.stringify(cfg));
  return cfg;
}

function json(raw) { try { return JSON.parse(raw); } catch (_) { return null; } }

async function api(path, cfg) {
  const url = "https://sg-public-api.hoyolab.com/event/game_record/genshin/api/" + path
    + "?server=" + encodeURIComponent(cfg.server)
    + "&role_id=" + encodeURIComponent(cfg.roleId);
  const req = new Request(url);
  req.headers = {
    Cookie: Keychain.get(COOKIE_KEY),
    "x-rpc-app_version": "2.34.1",
    "x-rpc-client_type": "5",
    "x-rpc-language": "zh-cn",
    Referer: "https://www.hoyolab.com/"
  };
  const data = json(await req.loadString());
  if (!data || data.retcode !== 0) throw new Error((data && data.message) || "HoYoLAB 请求失败");
  return data.data || {};
}

function duration(seconds) {
  const s = Math.max(0, Number(seconds || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? h + "小时" + (m ? m + "分" : "") : m + "分钟";
}
function percent(value, max) { return Math.round(Number(value || 0) / Math.max(1, Number(max || 1)) * 100); }

async function getData(cfg) {
  const cached = Keychain.contains(CACHE_KEY) ? json(Keychain.get(CACHE_KEY)) : null;
  try {
    if (!cfg.roleId || !Keychain.contains(COOKIE_KEY)) throw new Error("尚未完成设置");
    const result = { ok: true, at: Date.now(), d: await api("daily-note", cfg) };
    Keychain.set(CACHE_KEY, JSON.stringify(result));
    return result;
  } catch (error) {
    if (cached) return Object.assign(cached, { stale: true, error: error.message });
    return { ok: false, error: error.message, at: Date.now(), d: {} };
  }
}

function addHeader(widget, cfg, data) {
  const row = widget.addStack(); row.centerAlignContent();
  const mark = row.addText("原"); mark.font = Font.boldSystemFont(layout.logo); mark.textColor = UI.colors.accent;
  row.addSpacer(9);
  const col = row.addStack(); col.layoutVertically();
  UI.label(col, cfg.nickname, type.header, UI.colors.ink, "bold");
  UI.label(col, data.stale ? "缓存数据 · 请检查 Cookie" : "提瓦特状态面板", type.caption, data.stale ? UI.colors.danger : UI.colors.muted);
  row.addSpacer(); UI.badge(row, "UID " + (cfg.roleId || "未设置"), UI.colors.muted);
}

function addResin(widget, d) {
  const card = UI.card(widget, spacing.cardRadius);
  UI.setPadding(card, spacing.cardPadding, spacing.cardPadding, spacing.cardPadding, spacing.cardPadding);
  const top = card.addStack(); top.centerAlignContent();
  UI.label(top, "原粹树脂", type.body, UI.colors.muted, "semibold"); top.addSpacer();
  UI.label(top, `${d.current_resin || 0} / ${d.max_resin || 160}`, type.title, UI.colors.ink, "bold");
  card.addSpacer(9); UI.progress(card, d.current_resin || 0, d.max_resin || 160); card.addSpacer(7);
  const bottom = card.addStack(); bottom.centerAlignContent();
  UI.label(bottom, d.current_resin >= d.max_resin ? "已回满" : "回满预计 " + duration(d.resin_recovery_time), type.caption, UI.colors.muted);
  bottom.addSpacer(); UI.label(bottom, percent(d.current_resin, d.max_resin) + "%", type.caption, UI.colors.accent, "bold");
}

function addGrid(widget, d) {
  const grid = widget.addStack(); grid.spacing = spacing.gap;
  const commission = UI.card(grid); UI.setPadding(commission, 12, 12, 12, 12);
  UI.label(commission, "每日委托", type.caption, UI.colors.muted); commission.addSpacer(5);
  UI.label(commission, (d.finished_task_num || 0) + " / " + (d.total_task_num || 4), type.title, UI.colors.ink, "bold");
  UI.label(commission, d.is_extra_task_reward_received ? "额外奖励已领取" : "额外奖励待领取", type.micro, d.is_extra_task_reward_received ? UI.colors.muted : UI.colors.success);
  grid.addSpacer(1);
  const teapot = UI.card(grid); UI.setPadding(teapot, 12, 12, 12, 12);
  UI.label(teapot, "洞天宝钱", type.caption, UI.colors.muted); teapot.addSpacer(5);
  UI.label(teapot, (d.current_home_coin || 0) + " / " + (d.max_home_coin || 2400), type.title, UI.colors.ink, "bold");
  UI.label(teapot, d.home_coin_recovery_time ? "还有 " + duration(d.home_coin_recovery_time) : "已储满", type.micro, UI.colors.muted);
}

function addWeekly(widget) {
  const card = UI.card(widget, spacing.cardRadius); UI.setPadding(card, 12, spacing.cardPadding, 12, spacing.cardPadding);
  const row = card.addStack(); row.centerAlignContent();
  UI.label(row, "周本提醒", type.body, UI.colors.ink, "semibold"); row.addSpacer(); UI.badge(row, "每周一刷新", UI.colors.accent);
  card.addSpacer(8); UI.label(card, "本周可优先领取折扣奖励的周本", type.caption, UI.colors.muted); card.addSpacer(6);
  for (const name of ["鸣神岛·天守", "梦想乐土之殁", "黄金屋", "「净琉璃工坊」"]) {
    const item = card.addStack(); item.centerAlignContent(); UI.label(item, "•  " + name, type.caption, UI.colors.ink); item.addSpacer(); UI.label(item, "待确认", type.micro, UI.colors.muted);
  }
}

async function render() {
  let cfg = await readConfig();
  if (!Keychain.contains(COOKIE_KEY) || !cfg.roleId) cfg = await setup();
  const data = await getData(cfg);
  const widget = new ListWidget(); DesignSystem.applyCardBackground(widget, theme);
  widget.setPadding(spacing.pagePadding, spacing.pagePadding, spacing.pagePadding, spacing.pagePadding);
  addHeader(widget, cfg, data); widget.addSpacer(12); addResin(widget, data.d); widget.addSpacer(8); addGrid(widget, data.d); widget.addSpacer(8); addWeekly(widget); widget.addSpacer();
  const footer = widget.addStack(); footer.centerAlignContent();
  UI.label(footer, "更新于 " + new Date(data.at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), type.micro, UI.colors.muted);
  footer.addSpacer(); UI.label(footer, "点按脚本可重新设置", type.micro, UI.colors.muted);
  return widget;
}

const widget = await render();
if (config.runsInWidget) Script.setWidget(widget); else await widget.presentLarge();
Script.complete();
