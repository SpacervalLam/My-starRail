# 🌠 星穹铁道抽卡分析工具 StarRail Gacha Analyzer

<div align="right">
  <a href="README.zh-CN.md">简体中文</a> | <a href="README.md">English</a>
</div>


A desktop application for analyzing Honkai: Star Rail gacha logs locally.

## 📖 Usage

**Prerequisite**: Ensure that within the last 24 hours, you have run Honkai: Star Rail on the device where this tool is installed and viewed the gacha history for the account you wish to query.

1. Wait for the program to launch, select or enter the target UID, click the `开始分析` button,
2. wait for the analysis to complete, then click any item in the gacha record list to view detailed information.

P.S.: I forgot to handle port conflicts. Before launching, check if any other program is using port 3168.
P.P.S.: 3168 is the first four digits of my QQ number.

## 🖼️ Screenshots

![Settings](docs/screenshot1.png)

![Main UI](docs/screenshot2.gif)

## ✨ Features

- Automatically extract gacha URLs from log files
- Analyze 5★ statistics, pity counts, etc.
- Local database with multi-UID support


## 🛠️ Tech Stack

- Frontend: Vue 3 + Vite
- Backend: NestJS + TypeORM + SQLite
- Desktop: Electron + electron-builder

## 🚀 Getting Started

Download from [Releases](https://github.com/SpacervalLam/StarRail-toolkit/releases)

- **Portable Version**: Download and unzip the file `My-starRail. 1.0.0. zip` to any directory, and run `My-starRail. exe`
- **Installer Version**: Run `My-starRail.Setup.1.0.0.exe`,Follow the steps to complete the installation.  


## 🌐 Languages

- 中文 (default)
- English
- 日本語

## 🧩 Development & Build

```bash
npm install
npm run start:dev     # start dev server

npm run dist:win      # build for windows
npm run dist:mac      # build for mac
npm run dist:linux    # build for linux
````

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md)

## 📄 License

MIT License © 2025 [SpacervalLam](https://github.com/SpacervalLam/StarRail-toolkit/blob/main/LICENSE) 



```
My-starRail
├─ .npmrc
├─ CHANGELOG.md
├─ client
│  ├─ index.html
│  ├─ public
│  │  └─ assets
│  │     ├─ avatars
│  │     │  ├─ 1001.png
│  │     │  ├─ 1002.png
│  │     │  ├─ 1003.png
│  │     │  ├─ 1004.png
│  │     │  ├─ 1005.png
│  │     │  ├─ 1006.png
│  │     │  ├─ 1008.png
│  │     │  ├─ 1009.png
│  │     │  ├─ 1013.png
│  │     │  ├─ 1101.png
│  │     │  ├─ 1102.png
│  │     │  ├─ 1103.png
│  │     │  ├─ 1104.png
│  │     │  ├─ 1105.png
│  │     │  ├─ 1106.png
│  │     │  ├─ 1107.png
│  │     │  ├─ 1108.png
│  │     │  ├─ 1109.png
│  │     │  ├─ 1110.png
│  │     │  ├─ 1111.png
│  │     │  ├─ 1112.png
│  │     │  ├─ 1201.png
│  │     │  ├─ 1202.png
│  │     │  ├─ 1203.png
│  │     │  ├─ 1204.png
│  │     │  ├─ 1205.png
│  │     │  ├─ 1206.png
│  │     │  ├─ 1207.png
│  │     │  ├─ 1208.png
│  │     │  ├─ 1209.png
│  │     │  ├─ 1210.png
│  │     │  ├─ 1211.png
│  │     │  ├─ 1212.png
│  │     │  ├─ 1213.png
│  │     │  ├─ 1214.png
│  │     │  ├─ 1215.png
│  │     │  ├─ 1217.png
│  │     │  ├─ 1218.png
│  │     │  ├─ 1220.png
│  │     │  ├─ 1221.png
│  │     │  ├─ 1222.png
│  │     │  ├─ 1223.png
│  │     │  ├─ 1224.png
│  │     │  ├─ 1225.png
│  │     │  ├─ 1301.png
│  │     │  ├─ 1302.png
│  │     │  ├─ 1303.png
│  │     │  ├─ 1304.png
│  │     │  ├─ 1305.png
│  │     │  ├─ 1306.png
│  │     │  ├─ 1307.png
│  │     │  ├─ 1308.png
│  │     │  ├─ 1309.png
│  │     │  ├─ 1310.png
│  │     │  ├─ 1312.png
│  │     │  ├─ 1313.png
│  │     │  ├─ 1314.png
│  │     │  ├─ 1315.png
│  │     │  ├─ 1317.png
│  │     │  ├─ 1401.png
│  │     │  ├─ 1402.png
│  │     │  ├─ 1403.png
│  │     │  ├─ 1404.png
│  │     │  ├─ 1405.png
│  │     │  ├─ 1407.png
│  │     │  ├─ 20000.png
│  │     │  ├─ 20001.png
│  │     │  ├─ 20002.png
│  │     │  ├─ 20003.png
│  │     │  ├─ 20004.png
│  │     │  ├─ 20005.png
│  │     │  ├─ 20006.png
│  │     │  ├─ 20007.png
│  │     │  ├─ 20008.png
│  │     │  ├─ 20009.png
│  │     │  ├─ 20010.png
│  │     │  ├─ 20011.png
│  │     │  ├─ 20012.png
│  │     │  ├─ 20013.png
│  │     │  ├─ 20014.png
│  │     │  ├─ 20015.png
│  │     │  ├─ 20016.png
│  │     │  ├─ 20017.png
│  │     │  ├─ 20018.png
│  │     │  ├─ 20019.png
│  │     │  ├─ 20020.png
│  │     │  ├─ 20021.png
│  │     │  ├─ 20022.png
│  │     │  ├─ 21000.png
│  │     │  ├─ 21001.png
│  │     │  ├─ 21002.png
│  │     │  ├─ 21003.png
│  │     │  ├─ 21004.png
│  │     │  ├─ 21005.png
│  │     │  ├─ 21006.png
│  │     │  ├─ 21007.png
│  │     │  ├─ 21008.png
│  │     │  ├─ 21009.png
│  │     │  ├─ 21010.png
│  │     │  ├─ 21011.png
│  │     │  ├─ 21012.png
│  │     │  ├─ 21013.png
│  │     │  ├─ 21014.png
│  │     │  ├─ 21015.png
│  │     │  ├─ 21016.png
│  │     │  ├─ 21017.png
│  │     │  ├─ 21018.png
│  │     │  ├─ 21019.png
│  │     │  ├─ 21020.png
│  │     │  ├─ 21021.png
│  │     │  ├─ 21022.png
│  │     │  ├─ 21023.png
│  │     │  ├─ 21024.png
│  │     │  ├─ 21025.png
│  │     │  ├─ 21026.png
│  │     │  ├─ 21027.png
│  │     │  ├─ 21028.png
│  │     │  ├─ 21029.png
│  │     │  ├─ 21030.png
│  │     │  ├─ 21031.png
│  │     │  ├─ 21032.png
│  │     │  ├─ 21033.png
│  │     │  ├─ 21034.png
│  │     │  ├─ 21035.png
│  │     │  ├─ 21036.png
│  │     │  ├─ 21037.png
│  │     │  ├─ 21038.png
│  │     │  ├─ 21039.png
│  │     │  ├─ 21040.png
│  │     │  ├─ 21041.png
│  │     │  ├─ 21042.png
│  │     │  ├─ 21043.png
│  │     │  ├─ 21044.png
│  │     │  ├─ 21045.png
│  │     │  ├─ 21046.png
│  │     │  ├─ 21047.png
│  │     │  ├─ 21048.png
│  │     │  ├─ 21050.png
│  │     │  ├─ 21051.png
│  │     │  ├─ 21052.png
│  │     │  ├─ 22000.png
│  │     │  ├─ 22001.png
│  │     │  ├─ 22002.png
│  │     │  ├─ 22003.png
│  │     │  ├─ 22004.png
│  │     │  ├─ 23000.png
│  │     │  ├─ 23001.png
│  │     │  ├─ 23002.png
│  │     │  ├─ 23003.png
│  │     │  ├─ 23004.png
│  │     │  ├─ 23005.png
│  │     │  ├─ 23006.png
│  │     │  ├─ 23007.png
│  │     │  ├─ 23008.png
│  │     │  ├─ 23009.png
│  │     │  ├─ 23010.png
│  │     │  ├─ 23011.png
│  │     │  ├─ 23012.png
│  │     │  ├─ 23013.png
│  │     │  ├─ 23014.png
│  │     │  ├─ 23015.png
│  │     │  ├─ 23016.png
│  │     │  ├─ 23017.png
│  │     │  ├─ 23018.png
│  │     │  ├─ 23019.png
│  │     │  ├─ 23020.png
│  │     │  ├─ 23021.png
│  │     │  ├─ 23022.png
│  │     │  ├─ 23023.png
│  │     │  ├─ 23024.png
│  │     │  ├─ 23025.png
│  │     │  ├─ 23026.png
│  │     │  ├─ 23027.png
│  │     │  ├─ 23028.png
│  │     │  ├─ 23029.png
│  │     │  ├─ 23030.png
│  │     │  ├─ 23031.png
│  │     │  ├─ 23032.png
│  │     │  ├─ 23033.png
│  │     │  ├─ 23034.png
│  │     │  ├─ 23035.png
│  │     │  ├─ 23036.png
│  │     │  ├─ 23037.png
│  │     │  ├─ 23038.png
│  │     │  ├─ 23039.png
│  │     │  ├─ 23040.png
│  │     │  ├─ 23041.png
│  │     │  ├─ 24000.png
│  │     │  ├─ 24001.png
│  │     │  ├─ 24002.png
│  │     │  ├─ 24003.png
│  │     │  ├─ 24004.png
│  │     │  ├─ 24005.png
│  │     │  ├─ 8000.png
│  │     │  ├─ 8001.png
│  │     │  ├─ 8002.png
│  │     │  ├─ 8003.png
│  │     │  ├─ 8004.png
│  │     │  ├─ 8005.png
│  │     │  ├─ 8006.png
│  │     │  ├─ 8007.png
│  │     │  ├─ 8008.png
│  │     │  └─ None.png
│  │     ├─ gif
│  │     │  └─ loading.gif
│  │     └─ logo.png
│  ├─ src
│  │  ├─ api
│  │  │  └─ gacha.ts
│  │  ├─ App.vue
│  │  ├─ components
│  │  │  ├─ GachaAnalyzer.vue
│  │  │  ├─ NavBar.vue
│  │  │  └─ SettingsModal.vue
│  │  ├─ i18n
│  │  │  ├─ en.json
│  │  │  ├─ ja.json
│  │  │  └─ zh-CN.json
│  │  ├─ main.js
│  │  ├─ shims-vue.d.ts
│  │  ├─ styles
│  │  └─ utils
│  │     └─ analyzeGacha.ts
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ docs
│  ├─ screenshot1.png
│  └─ screenshot2.gif
├─ electron-main.js
├─ LICENSE
├─ nest-cli.json
├─ package.json
├─ README.md
├─ README.zh-CN.md
├─ server
│  ├─ data
│  └─ src
│     ├─ app.module.ts
│     ├─ gacha
│     │  ├─ dto
│     │  │  └─ fetch-gacha.dto.ts
│     │  ├─ entities
│     │  │  └─ gacha-log.entity.ts
│     │  ├─ gacha.controller.ts
│     │  ├─ gacha.module.ts
│     │  └─ gacha.service.ts
│     └─ main.ts
├─ tsconfig.json
├─ tsconfig.server.json
└─ vite.config.ts

```