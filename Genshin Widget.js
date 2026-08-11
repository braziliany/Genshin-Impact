// 原神 · LPL Design System widget for Scriptable

const WIDGET_VERSION = "1.3.0";

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

const STORE = "genshin-widget-cn-v1";
const CACHE_KEY = STORE + ".cache";
const CONFIG_KEY = STORE + ".config";
const COOKIE_KEY = STORE + ".cookie";
const DEFAULT = { server: "cn_gf01", roleId: "", nickname: "旅行者" };
const MIYOUSHE = {
  host: "https://api-takumi-record.mihoyo.com",
  widgetNoteUrl: "https://api-takumi-record.mihoyo.com/game_record/genshin/aapi/widget/v2",
  deviceFpUrl: "https://public-data-api.mihoyo.com/device-fp/api/getFp",
  qrFetchUrl: "https://passport-api.mihoyo.com/account/ma-cn-passport/app/createQRLogin",
  qrQueryUrl: "https://passport-api.mihoyo.com/account/ma-cn-passport/app/queryQRLoginStatus",
  cookieTokenUrl: "https://passport-api.mihoyo.com/account/auth/api/getCookieAccountInfoBySToken",
  ltokenUrl: "https://passport-api.mihoyo.com/account/auth/api/getLTokenBySToken",
  appVersion: "2.109.0",
  clientType: "5",
  salt4X: "xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs"
};

function deviceUserAgent() {
  return `Mozilla/5.0 (Linux; Android 11; MI 8 SE Build/RQ3A.211001.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/104.0.5112.97 Mobile Safari/537.36 miHoYoBBS/${MIYOUSHE.appVersion}`;
}

function cookieValue(cookie, name) {
  const item = String(cookie || "").split(";").map(part => part.trim()).find(part => part.startsWith(name + "="));
  return item ? item.slice(name.length + 1) : "";
}

function mergeCookies(...values) {
  const fields = {};
  for (const value of values) {
    for (const part of String(value || "").split(";")) {
      const index = part.indexOf("=");
      if (index > 0) fields[part.slice(0, index).trim()] = part.slice(index + 1).trim();
    }
  }
  return Object.keys(fields).filter(key => fields[key]).map(key => `${key}=${fields[key]}`).join("; ");
}

async function requestJson(url, options = {}) {
  const request = new Request(url);
  request.method = options.method || "GET";
  request.timeoutInterval = options.timeout || 20;
  request.headers = options.headers || {};
  if (options.body !== undefined) request.body = JSON.stringify(options.body);
  const raw = await request.loadString();
  const data = json(raw);
  if (!data) throw new Error(`响应解析失败：${responsePreview(raw) || "空响应"}`);
  return data;
}

function qrHeaders(deviceId) {
  return {
    Accept: "application/json, text/plain, */*",
    "User-Agent": "HYPContainer/1.3.3.182",
    "x-rpc-app_id": "ddxf5dufpuyo",
    "x-rpc-client_type": "3",
    "x-rpc-device_id": deviceId,
    "Content-Type": "application/json"
  };
}

async function showLoginQr(url) {
  const web = new WebView();
  const encodedUrl = JSON.stringify(url);
  await web.loadHTML(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#17162f;color:#fff;font-family:-apple-system;text-align:center}main{padding:28px 18px}h2{margin:8px 0 10px}p{color:#aaa8c3;line-height:1.5}.box{display:inline-block;background:#fff;padding:16px;border-radius:20px;margin:18px 0}#qr{width:280px;height:280px}</style></head><body><main><h2>米游社安全登录</h2><p>请截图二维码，再使用米游社或游戏客户端的扫码功能从相册识别并确认。</p><div class="box"><div id="qr"></div></div><p>确认后返回 Scriptable，关闭此页面并点击“我已确认”。</p></main><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script><script>new QRCode(document.getElementById('qr'),{text:${encodedUrl},width:280,height:280,correctLevel:QRCode.CorrectLevel.M});</script></body></html>`);
  await web.present();
}

function wait(milliseconds) {
  return new Promise(resolve => Timer.schedule(milliseconds, false, resolve));
}

async function exchangeQrLogin(cfg) {
  const fetched = await requestJson(MIYOUSHE.qrFetchUrl, {
    method: "POST",
    headers: qrHeaders(cfg.deviceId),
    body: {}
  });
  if (fetched.retcode !== 0 || !fetched.data || !fetched.data.url) throw new Error(fetched.message || "无法生成登录二维码");
  const qrUrl = fetched.data.url;
  const ticket = fetched.data.ticket;
  if (!ticket) throw new Error("登录二维码缺少 ticket");
  await showLoginQr(qrUrl);

  const ready = new Alert();
  ready.title = "等待扫码确认";
  ready.message = "请先在米游社或游戏客户端完成扫码授权，再返回 Scriptable。";
  ready.addAction("我已确认");
  ready.addCancelAction("取消");
  if (await ready.present() === -1) throw new Error("已取消扫码登录");

  let login;
  for (let i = 0; i < 20; i++) {
    const queried = await requestJson(MIYOUSHE.qrQueryUrl, {
      method: "POST",
      headers: qrHeaders(cfg.deviceId),
      body: { ticket }
    });
    if (queried.retcode === -106) throw new Error("二维码已过期，请重新扫码");
    const state = queried.data && (queried.data.status || queried.data.stat);
    if (state === "Confirmed") {
      const token = queried.data.tokens && queried.data.tokens[0] && queried.data.tokens[0].token;
      const user = queried.data.user_info || {};
      if (token && user.aid && user.mid) login = { uid: String(user.aid), token, mid: user.mid };
      break;
    }
    await wait(1000);
  }
  if (!login) throw new Error("未检测到扫码确认，请重新运行后再试");

  let authCookie = mergeCookies(`stoken=${login.token}`, `stuid=${login.uid}`, `mid=${login.mid}`, `account_id=${login.uid}`);
  const headers = { Cookie: authCookie };

  const [cookieResult, ltokenResult] = await Promise.all([
    requestJson(MIYOUSHE.cookieTokenUrl, { headers }),
    requestJson(MIYOUSHE.ltokenUrl, { headers })
  ]);
  if (cookieResult.retcode !== 0 || !cookieResult.data || !cookieResult.data.cookie_token) throw new Error(cookieResult.message || "无法获取 CookieToken");
  if (ltokenResult.retcode !== 0 || !ltokenResult.data || !ltokenResult.data.ltoken) throw new Error(ltokenResult.message || "无法获取 LToken");
  authCookie = mergeCookies(
    Keychain.contains(COOKIE_KEY) ? Keychain.get(COOKIE_KEY) : "",
    authCookie,
    `cookie_token=${cookieResult.data.cookie_token}`,
    `ltoken=${ltokenResult.data.ltoken}`,
    `ltuid=${login.uid}`
  );
  Keychain.set(COOKIE_KEY, authCookie);
  return true;
}

function randomHex(length) {
  let value = "";
  for (let i = 0; i < length; i++) value += "0123456789abcdef"[Math.floor(Math.random() * 16)];
  return value;
}

function randomUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, token => {
    const r = Math.floor(Math.random() * 16);
    return (token === "x" ? r : (r & 3) | 8).toString(16);
  });
}

async function readConfig() {
  const raw = Keychain.contains(CONFIG_KEY) ? Keychain.get(CONFIG_KEY) : "";
  let cfg;
  try { cfg = Object.assign({}, DEFAULT, raw ? JSON.parse(raw) : {}); }
  catch (_) { cfg = Object.assign({}, DEFAULT); }
  const savedCookie = Keychain.contains(COOKIE_KEY) ? Keychain.get(COOKIE_KEY) : "";
  const cookieFp = cookieValue(savedCookie, "DEVICEFP");
  cfg.deviceId = cfg.deviceId || cookieValue(savedCookie, "_MHYUUID") || randomUUID();
  if (cfg.deviceFpSource === "server" && cfg.fpDeviceId === cfg.deviceId && /^[0-9a-f]{13}$/i.test(cfg.deviceFp || "")) {
    // 保留由公开设备指纹接口为当前 deviceId 签发的配套指纹。
  } else if (cookieFp) {
    cfg.deviceFp = cookieFp;
    cfg.deviceFpSource = "cookie";
  } else if (cfg.deviceFpSource !== "manual") {
    // 1.0.0 曾生成随机 DEVICEFP；新版清除这类无法通过服务端校验的值。
    cfg.deviceFp = "";
    cfg.deviceFpSource = "";
  }
  Keychain.set(CONFIG_KEY, JSON.stringify(cfg));
  return cfg;
}

async function setup() {
  const cfg = await readConfig();
  const hasCookie = Keychain.contains(COOKIE_KEY);
  const alert = new Alert();
  alert.title = "原神国服组件设置";
  alert.message = hasCookie
    ? "Cookie 已保存。推荐使用安全扫码登录补齐 SToken；Token 只保存在本机 Keychain。"
    : "推荐使用安全扫码登录，无需手工抓取 Cookie。也可以继续粘贴完整 Cookie。";
  alert.addTextField(hasCookie ? "米游社 Cookie（留空保留）" : "米游社 Cookie", "");
  alert.addTextField("国服游戏 UID", cfg.roleId);
  alert.addTextField("显示昵称", cfg.nickname);
  alert.addTextField("服务器（官服 cn_gf01）", cfg.server);
  alert.addTextField("DEVICEFP（可留空自动获取）", cfg.deviceFp || "");
  alert.addAction("保存");
  alert.addAction("安全扫码登录");
  alert.addCancelAction("稍后设置");
  const action = await alert.present();
  if (action === -1) return cfg;
  const cookie = alert.textFieldValue(0).trim();
  cfg.roleId = alert.textFieldValue(1).trim();
  cfg.nickname = alert.textFieldValue(2).trim() || "旅行者";
  cfg.server = alert.textFieldValue(3).trim() || "cn_gf01";
  const cookieFp = cookieValue(cookie, "DEVICEFP");
  const enteredFp = cookieFp || alert.textFieldValue(4).trim();
  if (enteredFp && !/^[0-9a-f]{13}$/i.test(enteredFp)) {
    const invalid = new Alert();
    invalid.title = "DEVICEFP 格式错误";
    invalid.message = "请从米游社 Cookie 列表复制完整的 13 位 DEVICEFP，只填写值本身。";
    invalid.addAction("知道了");
    await invalid.present();
  }
  if (/^[0-9a-f]{13}$/i.test(enteredFp) && enteredFp !== cfg.deviceFp) {
    cfg.deviceFp = enteredFp;
    cfg.deviceFpSource = cookieFp ? "cookie" : "manual";
    cfg.fpDeviceId = "";
  }
  cfg.deviceId = cookieValue(cookie, "_MHYUUID") || cfg.deviceId || randomUUID();
  if (cookie) Keychain.set(COOKIE_KEY, cookie);
  Keychain.set(CONFIG_KEY, JSON.stringify(cfg));
  if (action === 1) {
    try {
      await exchangeQrLogin(cfg);
      const success = new Alert();
      success.title = "登录成功";
      success.message = "授权 Token 已安全保存到 Scriptable Keychain。";
      success.addAction("继续");
      await success.present();
    } catch (error) {
      const failed = new Alert();
      failed.title = "扫码登录失败";
      failed.message = error.message || String(error);
      failed.addAction("知道了");
      await failed.present();
    }
  }
  return cfg;
}

async function refreshDeviceFp(cfg, force = false) {
  if (!force && cfg.deviceFpSource === "server" && cfg.fpDeviceId === cfg.deviceId && /^[0-9a-f]{13}$/i.test(cfg.deviceFp || "")) return true;
  const extFields = {
    userAgent: deviceUserAgent(),
    browserScreenSize: 253125,
    maxTouchPoints: 5,
    isTouchSupported: true,
    browserLanguage: "zh-CN",
    browserPlat: "Linux armv8l",
    browserTimeZone: "Asia/Shanghai",
    webGlRender: "Adreno (TM) 616",
    webGlVendor: "Qualcomm",
    numOfPlugins: 0,
    listOfPlugins: "unknown",
    screenRatio: 3,
    deviceMemory: "unknown",
    hardwareConcurrency: "8",
    cpuClass: "unknown",
    ifNotTrack: "unknown",
    ifAdBlock: 0,
    hasLiedResolution: 0,
    hasLiedOs: 0,
    hasLiedBrowser: 0
  };
  try {
    const request = new Request(MIYOUSHE.deviceFpUrl);
    request.method = "POST";
    request.timeoutInterval = 20;
    request.headers = { "Content-Type": "application/json" };
    request.body = JSON.stringify({
      seed_id: randomHex(32),
      device_id: cfg.deviceId.toLowerCase(),
      platform: "5",
      seed_time: String(Date.now()),
      ext_fields: JSON.stringify(extFields),
      app_name: "account_cn",
      device_fp: randomHex(13)
    });
    const result = json(await request.loadString());
    const fp = result && result.retcode === 0 && result.data && result.data.code === 200 ? result.data.device_fp : "";
    if (!/^[0-9a-f]{13}$/i.test(fp || "")) return false;
    cfg.deviceFp = fp;
    cfg.deviceFpSource = "server";
    cfg.fpDeviceId = cfg.deviceId;
    Keychain.set(CONFIG_KEY, JSON.stringify(cfg));
    return true;
  } catch (_) {
    return false;
  }
}

function json(raw) { try { return JSON.parse(raw); } catch (_) { return null; } }

function md5(input) {
  function add32(a, b) { return (a + b) & 0xffffffff; }
  function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  function cycle(x, k) {
    let [a, b, c, d] = x;
    a=ff(a,b,c,d,k[0],7,-680876936); d=ff(d,a,b,c,k[1],12,-389564586); c=ff(c,d,a,b,k[2],17,606105819); b=ff(b,c,d,a,k[3],22,-1044525330);
    a=ff(a,b,c,d,k[4],7,-176418897); d=ff(d,a,b,c,k[5],12,1200080426); c=ff(c,d,a,b,k[6],17,-1473231341); b=ff(b,c,d,a,k[7],22,-45705983);
    a=ff(a,b,c,d,k[8],7,1770035416); d=ff(d,a,b,c,k[9],12,-1958414417); c=ff(c,d,a,b,k[10],17,-42063); b=ff(b,c,d,a,k[11],22,-1990404162);
    a=ff(a,b,c,d,k[12],7,1804603682); d=ff(d,a,b,c,k[13],12,-40341101); c=ff(c,d,a,b,k[14],17,-1502002290); b=ff(b,c,d,a,k[15],22,1236535329);
    a=gg(a,b,c,d,k[1],5,-165796510); d=gg(d,a,b,c,k[6],9,-1069501632); c=gg(c,d,a,b,k[11],14,643717713); b=gg(b,c,d,a,k[0],20,-373897302);
    a=gg(a,b,c,d,k[5],5,-701558691); d=gg(d,a,b,c,k[10],9,38016083); c=gg(c,d,a,b,k[15],14,-660478335); b=gg(b,c,d,a,k[4],20,-405537848);
    a=gg(a,b,c,d,k[9],5,568446438); d=gg(d,a,b,c,k[14],9,-1019803690); c=gg(c,d,a,b,k[3],14,-187363961); b=gg(b,c,d,a,k[8],20,1163531501);
    a=gg(a,b,c,d,k[13],5,-1444681467); d=gg(d,a,b,c,k[2],9,-51403784); c=gg(c,d,a,b,k[7],14,1735328473); b=gg(b,c,d,a,k[12],20,-1926607734);
    a=hh(a,b,c,d,k[5],4,-378558); d=hh(d,a,b,c,k[8],11,-2022574463); c=hh(c,d,a,b,k[11],16,1839030562); b=hh(b,c,d,a,k[14],23,-35309556);
    a=hh(a,b,c,d,k[1],4,-1530992060); d=hh(d,a,b,c,k[4],11,1272893353); c=hh(c,d,a,b,k[7],16,-155497632); b=hh(b,c,d,a,k[10],23,-1094730640);
    a=hh(a,b,c,d,k[13],4,681279174); d=hh(d,a,b,c,k[0],11,-358537222); c=hh(c,d,a,b,k[3],16,-722521979); b=hh(b,c,d,a,k[6],23,76029189);
    a=hh(a,b,c,d,k[9],4,-640364487); d=hh(d,a,b,c,k[12],11,-421815835); c=hh(c,d,a,b,k[15],16,530742520); b=hh(b,c,d,a,k[2],23,-995338651);
    a=ii(a,b,c,d,k[0],6,-198630844); d=ii(d,a,b,c,k[7],10,1126891415); c=ii(c,d,a,b,k[14],15,-1416354905); b=ii(b,c,d,a,k[5],21,-57434055);
    a=ii(a,b,c,d,k[12],6,1700485571); d=ii(d,a,b,c,k[3],10,-1894986606); c=ii(c,d,a,b,k[10],15,-1051523); b=ii(b,c,d,a,k[1],21,-2054922799);
    a=ii(a,b,c,d,k[8],6,1873313359); d=ii(d,a,b,c,k[15],10,-30611744); c=ii(c,d,a,b,k[6],15,-1560198380); b=ii(b,c,d,a,k[13],21,1309151649);
    a=ii(a,b,c,d,k[4],6,-145523070); d=ii(d,a,b,c,k[11],10,-1120210379); c=ii(c,d,a,b,k[2],15,718787259); b=ii(b,c,d,a,k[9],21,-343485551);
    x[0]=add32(a,x[0]); x[1]=add32(b,x[1]); x[2]=add32(c,x[2]); x[3]=add32(d,x[3]);
  }
  function block(s) { const out=[]; for(let i=0;i<64;i+=4) out[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24); return out; }
  const value = unescape(encodeURIComponent(String(input)));
  const state = [1732584193,-271733879,-1732584194,271733878];
  let i;
  for(i=64;i<=value.length;i+=64) cycle(state, block(value.substring(i-64,i)));
  const tail = Array(16).fill(0), rest = value.substring(i-64);
  for(i=0;i<rest.length;i++) tail[i>>2] |= rest.charCodeAt(i) << ((i%4)<<3);
  tail[i>>2] |= 0x80 << ((i%4)<<3);
  if(i>55) { cycle(state,tail); for(i=0;i<16;i++) tail[i]=0; }
  tail[14]=value.length*8; cycle(state,tail);
  const hex=[]; for(const n of state) for(i=0;i<4;i++) hex.push((n>>(i*8+4))&15,(n>>(i*8))&15);
  return hex.map(n=>"0123456789abcdef"[n]).join("");
}

function makeDS(query) {
  const t = Math.floor(Date.now() / 1000);
  const r = Math.floor(Math.random() * 100000) + 100001;
  const source = `salt=${MIYOUSHE.salt4X}&t=${t}&r=${r}&b=&q=${query}`;
  return `${t},${r},${md5(source)}`;
}

function apiMessage(data) {
  const code = Number(data && data.retcode);
  if (code === -10001) return "米游社 Cookie 已失效，请重新获取";
  if (code === 10001) return "米游社未识别登录状态：请粘贴同一域名的完整 Cookie";
  if (code === 10102) return "请先在米游社开启实时便笺/角色信息公开";
  if (code === 1034) return "米游社触发风控验证：请先在米游社完成验证并稍后重试";
  if (code === 5003) return "米游社主接口设备/风控校验失败";
  return (data && data.message) || "米游社请求失败";
}

function responsePreview(raw) {
  return String(raw || "")
    .replace(/\s+/g, " ")
    .replace(/[A-Za-z0-9_=-]{40,}/g, "[已隐藏长字段]")
    .slice(0, 180);
}

async function api(path, cfg, retried = false) {
  const query = [
    "role_id=" + encodeURIComponent(cfg.roleId),
    "server=" + encodeURIComponent(cfg.server)
  ].sort().join("&");
  const url = `${MIYOUSHE.host}/game_record/app/genshin/api/${path}?${query}`;
  const req = new Request(url);
  req.timeoutInterval = 20;
  const headers = {
    Accept: "application/json,text/plain,*/*",
    Cookie: Keychain.get(COOKIE_KEY),
    DS: makeDS(query),
    "x-rpc-app_version": MIYOUSHE.appVersion,
    "x-rpc-client_type": MIYOUSHE.clientType,
    "x-rpc-language": "zh-cn",
    "x-rpc-device_id": cfg.deviceId || randomUUID(),
    "x-rpc-device_model": "MI 8 SE",
    "x-rpc-device_name": "Xiaomi MI 8 SE",
    "x-rpc-sys_version": "11",
    "x-rpc-tool_version": "v4.2.2-ys",
    "x-rpc-page": "v4.2.2-ys_#/ys/daily",
    Origin: "https://webstatic.mihoyo.com",
    Referer: "https://webstatic.mihoyo.com/",
    "X-Requested-With": "com.mihoyo.hyperion",
    "User-Agent": deviceUserAgent()
  };
  if (/^[0-9a-f]{13}$/i.test(cfg.deviceFp || "")) headers["x-rpc-device_fp"] = cfg.deviceFp;
  req.headers = headers;
  const raw = await req.loadString();
  const status = req.response ? req.response.statusCode : "?";
  const data = json(raw);
  if (!data) {
    const preview = responsePreview(raw) || "空响应";
    throw new Error(`响应解析失败（HTTP ${status}）：${preview}`);
  }
  if (data.retcode !== 0) {
    if (Number(data.retcode) === 5003 && !retried && await refreshDeviceFp(cfg, true)) return api(path, cfg, true);
    const error = new Error(`${apiMessage(data)}（retcode ${data.retcode}，HTTP ${status}）`);
    error.retcode = Number(data.retcode);
    throw error;
  }
  return data.data || {};
}

async function widgetNoteApi(cfg) {
  const request = new Request(MIYOUSHE.widgetNoteUrl);
  request.timeoutInterval = 20;
  request.headers = {
    Accept: "*/*",
    Cookie: Keychain.get(COOKIE_KEY),
    "x-rpc-device_id": String(cfg.deviceId || randomUUID()).toUpperCase(),
    "x-rpc-client_type": "1",
    "x-rpc-channel": "appstore",
    "x-rpc-device_model": "iPhone10,2",
    "x-rpc-device_name": "iPhone",
    "x-rpc-app_version": MIYOUSHE.appVersion,
    "x-rpc-sys_version": "17.0",
    Referer: "https://app.mihoyo.com",
    "User-Agent": "WidgetExtension/231 CFNetwork/1496.0.7 Darwin/23.5.0"
  };
  const raw = await request.loadString();
  const status = request.response ? request.response.statusCode : "?";
  const data = json(raw);
  if (!data) throw new Error(`iOS 小组件接口响应解析失败（HTTP ${status}）：${responsePreview(raw) || "空响应"}`);
  if (data.retcode !== 0) {
    const error = new Error(`${apiMessage(data)}（iOS 小组件接口 retcode ${data.retcode}，HTTP ${status}）`);
    error.retcode = Number(data.retcode);
    throw error;
  }
  return data.data || {};
}

async function dailyNote(cfg) {
  try {
    return await api("dailyNote", cfg);
  } catch (primaryError) {
    if (![1034, 5003].includes(Number(primaryError.retcode))) throw primaryError;
    try {
      return await widgetNoteApi(cfg);
    } catch (widgetError) {
      throw new Error(`主接口：${primaryError.message}\n备用接口：${widgetError.message}`);
    }
  }
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
    const result = { ok: true, at: Date.now(), d: await dailyNote(cfg) };
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
  const status = data.stale ? "缓存数据 · 请检查 Cookie" : data.ok ? "提瓦特状态面板" : "连接失败 · 请重新配置";
  UI.label(col, status, type.caption, data.ok && !data.stale ? UI.colors.muted : UI.colors.danger);
  row.addSpacer(); UI.badge(row, "UID " + (cfg.roleId || "未设置"), UI.colors.muted);
}

function addError(widget, message) {
  const card = UI.card(widget, spacing.cardRadius);
  UI.setPadding(card, spacing.cardPadding, spacing.cardPadding, spacing.cardPadding, spacing.cardPadding);
  UI.label(card, "无法获取实时数据", type.body, UI.colors.danger, "semibold");
  card.addSpacer(8);
  const detail = card.addText(String(message || "未知错误"));
  detail.font = UI.font(type.caption, "regular");
  detail.textColor = UI.colors.muted;
  detail.lineLimit = 3;
  card.addSpacer(8);
  UI.label(card, "请直接运行 Genshin Widget 重新输入 Cookie。", type.caption, UI.colors.ink);
}

function addResin(widget, d) {
  const maxResin = d.max_resin || 200;
  const card = UI.card(widget, spacing.cardRadius);
  UI.setPadding(card, spacing.cardPadding, spacing.cardPadding, spacing.cardPadding, spacing.cardPadding);
  const top = card.addStack(); top.centerAlignContent();
  UI.label(top, "原粹树脂", type.body, UI.colors.muted, "semibold"); top.addSpacer();
  UI.label(top, `${d.current_resin || 0} / ${maxResin}`, type.title, UI.colors.ink, "bold");
  card.addSpacer(9); UI.progress(card, d.current_resin || 0, maxResin); card.addSpacer(7);
  const bottom = card.addStack(); bottom.centerAlignContent();
  UI.label(bottom, d.current_resin >= maxResin ? "已回满" : "回满预计 " + duration(d.resin_recovery_time), type.caption, UI.colors.muted);
  bottom.addSpacer(); UI.label(bottom, percent(d.current_resin, maxResin) + "%", type.caption, UI.colors.accent, "bold");
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

function addWeekly(widget, d) {
  const remain = Number(d.remain_resin_discount_num ?? 0);
  const limit = Number(d.resin_discount_num_limit ?? 3);
  const card = UI.card(widget, spacing.cardRadius); UI.setPadding(card, 12, spacing.cardPadding, 12, spacing.cardPadding);
  const row = card.addStack(); row.centerAlignContent();
  UI.label(row, "周本减半奖励", type.body, UI.colors.ink, "semibold"); row.addSpacer(); UI.badge(row, "每周一刷新", UI.colors.accent);
  card.addSpacer(10);
  const count = card.addStack(); count.centerAlignContent();
  UI.label(count, "剩余次数", type.caption, UI.colors.muted); count.addSpacer();
  UI.label(count, `${remain} / ${limit}`, type.title, remain > 0 ? UI.colors.accent : UI.colors.muted, "bold");
  card.addSpacer(7);
  UI.label(card, remain > 0 ? "本周仍可领取征讨之花减半奖励" : "本周减半奖励已全部使用", type.caption, remain > 0 ? UI.colors.ink : UI.colors.muted);
}

async function render() {
  let cfg = await readConfig();
  if (config.runsInApp || !Keychain.contains(COOKIE_KEY) || !cfg.roleId) cfg = await setup();
  await refreshDeviceFp(cfg);
  const data = await getData(cfg);
  if (config.runsInApp && !data.ok) {
    const alert = new Alert();
    alert.title = "米游社接口诊断";
    alert.message = data.error || "未知错误";
    alert.addAction("知道了");
    await alert.present();
  }
  const widget = new ListWidget(); DesignSystem.applyCardBackground(widget, theme);
  widget.setPadding(spacing.pagePadding, spacing.pagePadding, spacing.pagePadding, spacing.pagePadding);
  addHeader(widget, cfg, data); widget.addSpacer(12);
  if (data.ok) {
    addResin(widget, data.d); widget.addSpacer(8); addGrid(widget, data.d); widget.addSpacer(8); addWeekly(widget, data.d);
  } else {
    addError(widget, data.error);
  }
  widget.addSpacer();
  const footer = widget.addStack(); footer.centerAlignContent();
  UI.label(footer, "更新于 " + new Date(data.at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), type.micro, UI.colors.muted);
  footer.addSpacer(); UI.label(footer, "点按脚本可重新设置", type.micro, UI.colors.muted);
  return widget;
}

const widget = await render();
if (config.runsInWidget) Script.setWidget(widget); else await widget.presentLarge();
Script.complete();
