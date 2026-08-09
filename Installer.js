// Genshin Impact · Scriptable Installer
// 运行方式：将本文件导入 Scriptable 后直接运行。

const OWNER = "braziliany";
const REPO = "Genshin-Impact";
const BRANCH = "main";
const BASE_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;
const fm = FileManager.iCloud();

const packages = [
  {
    name: "LPL-Design-System",
    file: "LPL-Design-System.js",
    required: true
  },
  {
    name: "原神 LPL 大号组件",
    file: "Genshin-LPL-Widget.js",
    required: true
  }
];

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

async function confirmInstall(existing) {
  const alert = new Alert();
  alert.title = "原神组件安装器";
  alert.message = existing
    ? "检测到已有安装。继续将更新设计系统和主组件文件。"
    : "将安装 LPL-Design-System 和原神大号组件。";
  alert.addAction(existing ? "更新" : "安装");
  alert.addCancelAction("取消");
  return (await alert.present()) === 0;
}

async function install() {
  const paths = packages.map(item => localPath(item.file));
  const existing = paths.some(path => fm.fileExists(path));
  if (!(await confirmInstall(existing))) return false;

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
  alert.message = "依赖已先安装：LPL-Design-System\n主组件随后已安装：Genshin-LPL-Widget\n\n现在可以运行 Genshin-LPL-Widget 完成 HoYoLAB 配置。";
  alert.addAction("运行主组件");
  alert.addCancelAction("完成");
  if (await alert.present() === 0) {
    Safari.open("scriptable:///run?scriptName=" + encodeURIComponent("Genshin-LPL-Widget"));
  }
}

await main();
Script.complete();
