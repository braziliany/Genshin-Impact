# 原神 LPL Scriptable Widget

## 正式开发入口

- `Genshin-LPL-Widget.js`：iPhone 大号组件主脚本
- `LPL-Design-System.js`：共享 UI 设计系统依赖

主脚本会在顶部导入 `LPL-Design-System`，缺少依赖时给出安装提示。推荐先运行 LPL-Scriptable 最新版 `Installer.js`；也可以手动将依赖保存到 Scriptable，脚本名称必须是 `LPL-Design-System`。

## 安装和运行

1. 先安装 `LPL-Design-System`。
2. 导入并运行 `Genshin-LPL-Widget.js`。
3. 首次运行输入 HoYoLAB Cookie、角色 UID 和昵称。
4. 在 iPhone 添加 Scriptable 大号组件并选择该脚本。

Cookie 只保存到 Scriptable Keychain。服务器默认是亚服 `os_asia`，国服可改为 `cn_gf01`。
