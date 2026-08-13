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
3. 安装完成后运行主组件，推荐选择“安全扫码登录”，再填写国服游戏 UID 和昵称；官服服务器保持 `cn_gf01`。
4. 在 iPhone 添加 Scriptable 大号组件并选择 `Genshin Widget`。

以后直接在 Scriptable App 中运行 `Genshin Widget`，会再次打开账号配置；Cookie 输入框留空会保留 Keychain 中的原值。桌面小组件自动刷新时不会弹出配置框。

组件显示原粹树脂、每日委托奖励、洞天财瓮 - 洞天宝钱、值得铭记的强敌、探索派遣限制和参量质变仪状态，名称与状态说明对标米游社实时便笺。只有数值实际达到接口返回的最大值时才显示达到上限；网络失败时保留上次成功数据，并明确显示缓存时间。探索派遣接口只能可靠区分“探索中”和“探索完成”，无法判断奖励是否已领取，因此组件不会把完成状态标记为“可领取”。

Cookie 与设备信息只保存到 Scriptable Keychain。组件使用国服米游社接口；官服为 `cn_gf01`，B 服为 `cn_qd01`。Cookie 需来自 `bbs.mihoyo.com` 的完整请求头；仅复制 `ltoken_v2 + ltmid_v2` 可能无法建立登录态。

组件会使用稳定的设备 ID，通过米游社公开的设备指纹接口自动申请配套 `DEVICEFP`。配置页中的 DEVICEFP 可以留空；遇到 `retcode 5003` 时会自动刷新指纹并重试一次。

若标准实时便笺接口仍返回 `5003` 或 `1034`，组件会自动改用米游社 iOS 小组件实时便笺接口。两个数据源都失败时，诊断弹窗会分别显示主接口和备用接口的错误。

安全扫码登录会生成一次性二维码；授权后 Passport QR 接口直接返回 SToken，脚本再在本机获取 LToken 与 CookieToken，凭证只写入 Scriptable Keychain。二维码页面使用 cdnjs 加载开源 QRCode.js，二维码内容在 WebView 本地生成。

需要移除授权时，直接运行主脚本并选择“退出登录”。脚本会删除 Keychain 中的 Cookie、Token 和组件缓存，但保留 UID、昵称及服务器设置。

### 获取米游社 Cookie

1. 在电脑浏览器登录 `https://bbs.mihoyo.com/`。
2. 按 `F12`，打开「应用/Application」→「Cookies」→ 米游社域名。
3. 推荐在「网络/Network」里打开任意米游社请求，复制 Request Headers 中完整的 `Cookie` 值。
4. 若只复制最小 Cookie，请另外复制 Cookie 列表中同一域名的 `DEVICEFP`（通常为 13 位十六进制字符）。
5. 不要把 Cookie 发给任何人；它属于账号登录凭证。

直接运行脚本时，接口失败会弹出诊断信息，包括 HTTP 状态和米游社 `retcode`。诊断内容不会包含请求 Cookie；反馈问题时只提供错误码和错误文字即可。
