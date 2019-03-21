const electron = require('electron');
const {
  app,
  BrowserWindow
} = electron;

function createWindow() {
  const {
    width,
    height
  } = electron.screen.getPrimaryDisplay().workAreaSize
  let win = new BrowserWindow({
    width,
    height
  });

  win.loadFile("index.html");

  win.webContents.openDevTools();

  win.on('closed', () => {
    win = null;
  })
}

app.on("ready", () => {
  createWindow();
})

app.on("window-all-closed", () => {
  if (process.platform == "darwin") {
    app.quit();
  }
})

app.on("activate", () => {
  if (win == null) {
    createWindow();
  }
});