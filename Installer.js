// Genshin Impact · Scriptable Installer
// 运行方式：将本文件导入 Scriptable 后直接运行。

const OWNER = "braziliany";
const REPO = "Genshin-Impact";
const BRANCH = "main";
const BASE_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;
const fm = FileManager.iCloud();
const FALLBACK_RELEASE = {
  version: "1.4.1",
  designSystemVersion: "2.9.1",
  notes: [
    "修正探索派遣完成状态文案，不再误报为可领取。",
    "派遣数字现在表示已使用槽位，完成数量单独显示。",
    "保留 1.4.0 的满值判断、缓存提示与登录管理功能。"
  ]
};

const packages = [
  {
    name: "LPL-Design-System",
    file: "LPL-Design-System.js",
    required: true
  },
  {
    name: "原神 LPL 大号组件",
    file: "Genshin Widget.js",
    required: true
  }
];

const legacyFiles = ["Genshin-LPL-Widget.js"];

function localPath(file) {
  return fm.joinPath(fm.documentsDirectory(), file);
}

async function fetchText(file) {
  const request = new Request(`${BASE_URL}/${encodeURIComponent(file)}`);
  request.method = "GET";
  request.timeoutInterval = 20;
  const text = await request.loadString();
  if (!text || text.length < 20) throw new Error(`${file} 内容为空`);
  return text;
}

function extractVersion(source) {
  const match = String(source || "").match(/WIDGET_VERSION\s*=\s*["']([^"']+)["']/);
  return match ? match[1] : "旧版";
}

async function readLocalVersion() {
  const path = localPath("Genshin Widget.js");
  if (!fm.fileExists(path)) return "未安装";
  try {
    if (fm.isFileStoredIniCloud(path)) await fm.downloadFileFromiCloud(path);
    return extractVersion(fm.readString(path));
  } catch (_) {
    return "未知";
  }
}

async function fetchRelease() {
  try {
    const release = JSON.parse(await fetchText("release.json"));
    return Object.assign({}, FALLBACK_RELEASE, release);
  } catch (_) {
    return FALLBACK_RELEASE;
  }
}

async function confirmInstall(localVersion, release) {
  const installed = localVersion !== "未安装";
  const current = installed && localVersion === release.version;
  const alert = new Alert();
  alert.title = !installed ? "安装 Genshin Widget" : current ? "重新安装" : "发现新版本";
  const notes = Array.isArray(release.notes) ? release.notes : FALLBACK_RELEASE.notes;
  alert.message = [
    `本地：${localVersion}`,
    `远端：${release.version}`,
    `设计系统：${release.designSystemVersion}`,
    "",
    "更新内容：",
    ...notes.map(note => `- ${note}`),
    "",
    "现有设置、Cookie 与组件缓存不会被覆盖。"
  ].join("\n");
  alert.addAction(!installed ? "安装" : current ? "重新安装" : "更新");
  alert.addCancelAction("取消");
  return (await alert.present()) === 0;
}

async function install() {
  const localVersion = await readLocalVersion();
  const release = await fetchRelease();
  if (!(await confirmInstall(localVersion, release))) return false;

  const downloaded = [];
  for (const item of packages) {
    try {
      downloaded.push({ item, text: await fetchText(item.file) });
    } catch (error) {
      const alert = new Alert();
      alert.title = "下载失败";
      alert.message = `${item.name}\n${error.message}\n\n请检查网络，或确认仓库 main 分支可访问。`;
      alert.addAction("知道了");
      await alert.present();
      return false;
    }
  }

  for (const entry of downloaded) {
    fm.writeString(localPath(entry.item.file), entry.text);
  }
  for (const file of legacyFiles) {
    const path = localPath(file);
    if (fm.fileExists(path)) fm.remove(path);
  }
  return true;
}

async function main() {
  if (!config.runsInApp) {
    const alert = new Alert();
    alert.title = "请在 Scriptable 中运行";
    alert.message = "安装器需要在 Scriptable App 内运行，不能从小组件中执行。";
    alert.addAction("知道了");
    await alert.present();
    return;
  }

  const success = await install();
  if (!success) return;
  const alert = new Alert();
  alert.title = "安装完成";
  alert.message = "依赖已先安装：LPL-Design-System\n主组件随后已安装：Genshin Widget\n\n现有 Cookie 和设置已保留。现在可以运行 Genshin Widget。";
  alert.addAction("运行主组件");
  alert.addCancelAction("完成");
  if (await alert.present() === 0) {
    Safari.open("scriptable:///run?scriptName=" + encodeURIComponent("Genshin Widget"));
  }
}

await main();
Script.complete();
