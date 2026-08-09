# 原神 LPL Scriptable Widget

## 正式开发入口

- `Genshin Widget.js`：iPhone 大号组件主脚本
- `LPL-Design-System.js`：正式共享 UI 设计系统依赖（v2.9.1）
- `Installer.js`：从 GitHub 自动安装/更新依赖和主组件
- `release.json`：安装器使用的远端版本号与更新说明

主脚本会在顶部导入 `LPL-Design-System`，缺少依赖时给出安装提示。推荐先运行 LPL-Scriptable 最新版 `Installer.js`；也可以手动将依赖保存到 Scriptable，脚本名称必须是 `LPL-Design-System`。

## 安装和运行

1. 将 `Installer.js` 导入 Scriptable 并运行。
2. 安装器会先安装 `LPL-Design-System`，再安装 `Genshin Widget`。
   安装前会显示本地/远端版本、设计系统版本和本次更新内容；重新安装不会覆盖 Keychain 设置与缓存。
3. 安装完成后运行主组件，输入米游社 Cookie、国服游戏 UID 和昵称；官服服务器保持 `cn_gf01`。
4. 在 iPhone 添加 Scriptable 大号组件并选择 `Genshin Widget`。

以后直接在 Scriptable App 中运行 `Genshin Widget`，会再次打开账号配置；Cookie 输入框留空会保留 Keychain 中的原值。桌面小组件自动刷新时不会弹出配置框。

Cookie 与设备信息只保存到 Scriptable Keychain。组件使用国服米游社接口；官服为 `cn_gf01`，B 服为 `cn_qd01`。Cookie 需来自 `bbs.mihoyo.com`，包含 `ltoken_v2 + ltmid_v2`，或旧版的 `ltoken + ltuid`。若返回 1034，还需填写同一浏览器 Cookie 列表中的 `DEVICEFP`。

若接口返回 `retcode 5003`，表示设备指纹未通过校验。请重新运行脚本并填写 Cookie 列表中真实的 13 位 `DEVICEFP`；脚本不会再自动生成随机值。

### 获取米游社 Cookie

1. 在电脑浏览器登录 `https://bbs.mihoyo.com/`。
2. 按 `F12`，打开「应用/Application」→「Cookies」→ 米游社域名。
3. 推荐在「网络/Network」里打开任意米游社请求，复制 Request Headers 中完整的 `Cookie` 值。
4. 若只复制最小 Cookie，请另外复制 Cookie 列表中同一域名的 `DEVICEFP`（通常为 13 位十六进制字符）。
5. 不要把 Cookie 发给任何人；它属于账号登录凭证。

直接运行脚本时，接口失败会弹出诊断信息，包括 HTTP 状态和米游社 `retcode`。诊断内容不会包含请求 Cookie；反馈问题时只提供错误码和错误文字即可。
