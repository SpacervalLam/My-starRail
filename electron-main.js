// electron-main.js
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// 区分开发 vs 打包
const isPackaged = app.isPackaged;

// 拷贝数据库
function copyDatabase() {
  const dbSrc = path.join(__dirname, 'server', 'data', 'gacha.sqlite');
  const dbDest = path.join(app.getPath('userData'), 'gacha.sqlite');

  if (!fs.existsSync(dbDest)) {
    fs.mkdirSync(path.dirname(dbDest), { recursive: true });

    try {
      const buffer = fs.readFileSync(dbSrc);
      fs.writeFileSync(dbDest, buffer);

      console.log('Database copied to', dbDest);
    } catch (err) {
      console.error('Failed to copy database:', err);
    }
  }
}

let mainWindow;

// 直接在同一进程中 require 并启动 NestJS
async function startBackend() {
  //const serverMain = path.join(resourcesPath, 'server', 'dist', 'main.js');
  const serverMain = path.join(__dirname, 'server', 'dist', 'main.js');
  console.log('Requiring backend bootstrap from', serverMain);
  const { bootstrap } = require(serverMain);
  if (typeof bootstrap !== 'function') {
    throw new Error('Backend bootstrap() not found');
  }
  await bootstrap();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  Menu.setApplicationMenu(null);

  const url = isPackaged
    ? `file://${path.join(__dirname, 'client', 'dist', 'index.html')}`
    : 'http://localhost:5173';

  mainWindow.loadURL(url);
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isCtrlShiftI =
      input.control && input.shift && input.code === 'KeyI';
    if (isCtrlShiftI) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  try {
    console.log('Initializing application...');
    copyDatabase();
    await startBackend();    // 直接启动后端
    createWindow();
    console.log('Application initialized successfully');
  } catch (err) {
    console.error('Initialization failed:', err);
    app.quit();
  }
  // // 监听渲染进程的 console 输出
  // win.webContents.on('console-message', (event, level, message) => {
  //   console.log(`[渲染进程日志] 级别: ${level}, 内容: ${message}`);
  // });
});



app.on('activate', () => !mainWindow && createWindow());
app.on('window-all-closed', () => {
  // Note: Nest 会在 same process exit 时自动清理
  if (process.platform !== 'darwin') app.quit();
});
