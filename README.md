# 原神 LPL Scriptable Widget

## 正式开发入口

- `Genshin-LPL-Widget.js`：iPhone 大号组件主脚本
- `LPL-Design-System.js`：正式共享 UI 设计系统依赖（v2.9.1）
- `Installer.js`：从 GitHub 自动安装/更新依赖和主组件

主脚本会在顶部导入 `LPL-Design-System`，缺少依赖时给出安装提示。推荐先运行 LPL-Scriptable 最新版 `Installer.js`；也可以手动将依赖保存到 Scriptable，脚本名称必须是 `LPL-Design-System`。

## 安装和运行

1. 将 `Installer.js` 导入 Scriptable 并运行。
2. 安装器会先安装 `LPL-Design-System`，再安装 `Genshin-LPL-Widget`。
3. 安装完成后运行主组件，输入 HoYoLAB Cookie、角色 UID 和昵称。
4. 在 iPhone 添加 Scriptable 大号组件并选择 `Genshin-LPL-Widget`。

Cookie 只保存到 Scriptable Keychain。服务器默认是亚服 `os_asia`，国服可改为 `cn_gf01`。
