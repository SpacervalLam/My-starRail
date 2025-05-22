# 🌠 米哈游抽卡分析工具 miHoYo Gacha Analyzer

<div align="right">
  <a href="README.zh-CN.md">简体中文</a> | <a href="README.md">English</a>
</div>

一款支持本地分析 **崩坏：星穹铁道**、**绝区零** 和 **原神** 抽卡记录与玩家数据的桌面应用程序。

---

## 📖 使用说明

**前提条件**：请确保在使用本工具前的 24 小时内，你已经在本设备上运行过游戏，并打开过相关账号的抽卡历史或角色展示界面。

### ✅ 崩坏：星穹铁道 / 绝区零

1. 启动程序，选择或输入目标 UID，点击 `开始分析` 按钮；
2. 等待分析完成后，点击任意抽卡记录条目可查看详细信息。

> ⚠️ 程序使用了固定端口 3168，请确保没有其他程序占用此端口。
> （是的，这是我 QQ 号的前四位 😅）

### ✅ 原神

1. 请将你想要查询的角色放入游戏内的「展示栏」（个人主页展示角色）中；
2. 打开程序，进入原神功能页面，即可查询该玩家的角色数据（如等级、武器、圣遗物等）。

---

## 🖼️ 截图预览

> 📸 预览图展示：

![截图1](docs/screenshot1.png)
![截图2](docs/screenshot2.png)
![截图3](docs/screenshot3.png)
![截图4](docs/screenshot4.png)

---

## ✨ 功能亮点

* 🔍 自动从日志文件中提取抽卡链接（支持星穹铁道 / 绝区零）
* 📊 分析五星出货统计、垫数、历史记录等
* 📁 本地数据库，支持多个 UID 管理
* 🎮 原神角色数据查询（基于主页展示栏）
* 💬 多语言支持（中文 / English / 日本語）

---

## 🛠️ 技术栈

* **前端**：Vue 3 + Vite
* **后端**：NestJS + TypeORM + SQLite
* **桌面**：Electron + electron-builder

---

## 🚀 开始使用

前往 [Releases](https://github.com/SpacervalLam/StarRail-toolkit/releases) 页面下载：

* **绿色版**：解压 `My-starRail.1.0.0.zip`，运行 `My-starRail.exe` 即可使用
* **安装版**：运行 `My-starRail.Setup.1.0.0.exe`，按照提示完成安装流程

---

## 🌐 多语言支持

* 中文（默认）
* English
* 日本語

---

## 🧩 开发与打包

```bash
npm install
npm run start:dev     # 启动开发服务器

npm run dist:win      # 打包 Windows 版本
npm run dist:mac      # 打包 macOS 版本
npm run dist:linux    # 打包 Linux 版本
```

---

## 📝 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)

---

## 📄 许可证

MIT License © 2025 [SpacervalLam](https://github.com/SpacervalLam/StarRail-toolkit/blob/main/LICENSE)

---

