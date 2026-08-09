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
const LPL = DesignSystem;
LPL.colors.ink = new Color(theme.white);
LPL.colors.muted = new Color(theme.muted);
LPL.colors.accent = new Color(theme.accent);
LPL.colors.success = new Color(theme.success);
LPL.colors.danger = new Color(theme.danger);

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
  const mark = row.addText("原"); mark.font = Font.boldSystemFont(22); mark.textColor = LPL.colors.accent;
  row.addSpacer(9);
  const col = row.addStack(); col.layoutVertically();
  LPL.label(col, cfg.nickname, typography.header, LPL.colors.ink, "bold");
  LPL.label(col, data.stale ? "缓存数据 · 请检查 Cookie" : "提瓦特状态面板", typography.caption, data.stale ? LPL.colors.danger : LPL.colors.muted);
  row.addSpacer(); LPL.badge(row, "UID " + (cfg.roleId || "未设置"), LPL.colors.muted);
}

function addResin(widget, d) {
  const card = LPL.card(widget, layout.cardRadius);
  LPL.setPadding(card, layout.cardPadding, layout.cardPadding, layout.cardPadding, layout.cardPadding);
  const top = card.addStack(); top.centerAlignContent();
  LPL.label(top, "原粹树脂", typography.body, LPL.colors.muted, "semibold"); top.addSpacer();
  LPL.label(top, `${d.current_resin || 0} / ${d.max_resin || 160}`, typography.title, LPL.colors.ink, "bold");
  card.addSpacer(9); LPL.progress(card, d.current_resin || 0, d.max_resin || 160); card.addSpacer(7);
  const bottom = card.addStack(); bottom.centerAlignContent();
  LPL.label(bottom, d.current_resin >= d.max_resin ? "已回满" : "回满预计 " + duration(d.resin_recovery_time), typography.caption, LPL.colors.muted);
  bottom.addSpacer(); LPL.label(bottom, percent(d.current_resin, d.max_resin) + "%", typography.caption, LPL.colors.accent, "bold");
}

function addGrid(widget, d) {
  const grid = widget.addStack(); grid.spacing = layout.gap;
  const commission = LPL.card(grid); LPL.setPadding(commission, 12, 12, 12, 12);
  LPL.label(commission, "每日委托", typography.caption, LPL.colors.muted); commission.addSpacer(5);
  LPL.label(commission, (d.finished_task_num || 0) + " / " + (d.total_task_num || 4), typography.title, LPL.colors.ink, "bold");
  LPL.label(commission, d.is_extra_task_reward_received ? "额外奖励已领取" : "额外奖励待领取", typography.micro, d.is_extra_task_reward_received ? LPL.colors.muted : LPL.colors.success);
  grid.addSpacer(1);
  const teapot = LPL.card(grid); LPL.setPadding(teapot, 12, 12, 12, 12);
  LPL.label(teapot, "洞天宝钱", typography.caption, LPL.colors.muted); teapot.addSpacer(5);
  LPL.label(teapot, (d.current_home_coin || 0) + " / " + (d.max_home_coin || 2400), typography.title, LPL.colors.ink, "bold");
  LPL.label(teapot, d.home_coin_recovery_time ? "还有 " + duration(d.home_coin_recovery_time) : "已储满", typography.micro, LPL.colors.muted);
}

function addWeekly(widget) {
  const card = LPL.card(widget, layout.cardRadius); LPL.setPadding(card, 12, layout.cardPadding, 12, layout.cardPadding);
  const row = card.addStack(); row.centerAlignContent();
  LPL.label(row, "周本提醒", typography.body, LPL.colors.ink, "semibold"); row.addSpacer(); LPL.badge(row, "每周一刷新", LPL.colors.accent);
  card.addSpacer(8); LPL.label(card, "本周可优先领取折扣奖励的周本", typography.caption, LPL.colors.muted); card.addSpacer(6);
  for (const name of ["鸣神岛·天守", "梦想乐土之殁", "黄金屋", "「净琉璃工坊」"]) {
    const item = card.addStack(); item.centerAlignContent(); LPL.label(item, "•  " + name, typography.caption, LPL.colors.ink); item.addSpacer(); LPL.label(item, "待确认", typography.micro, LPL.colors.muted);
  }
}

async function render() {
  let cfg = await readConfig();
  if (!Keychain.contains(COOKIE_KEY) || !cfg.roleId) cfg = await setup();
  const data = await getData(cfg);
  const widget = new ListWidget(); DesignSystem.applyCardBackground(widget, theme);
  widget.setPadding(layout.pagePadding, layout.pagePadding, layout.pagePadding, layout.pagePadding);
  addHeader(widget, cfg, data); widget.addSpacer(12); addResin(widget, data.d); widget.addSpacer(8); addGrid(widget, data.d); widget.addSpacer(8); addWeekly(widget); widget.addSpacer();
  const footer = widget.addStack(); footer.centerAlignContent();
  LPL.label(footer, "更新于 " + new Date(data.at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), typography.micro, LPL.colors.muted);
  footer.addSpacer(); LPL.label(footer, "点按脚本可重新设置", typography.micro, LPL.colors.muted);
  return widget;
}

const widget = await render();
if (config.runsInWidget) Script.setWidget(widget); else await widget.presentLarge();
Script.complete();
