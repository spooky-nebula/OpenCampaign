// Common requires of Electron
const electron = require('electron');
const {
  app,
  BrowserWindow,
  ipcMain
} = electron;

var mainWindow;

/*
This function creates a window the size of the user's screen and makes the icon
of the app our "splatter dragon". It also makes the top bar disappear so only
the close minimize and maximize button appear.
*/
function createMainWindow() {
  // Variables taken from the user's system
  const {
    width,
    height
  } = electron.screen.getPrimaryDisplay().workAreaSize;

  let win = new BrowserWindow({
    width,
    height,
    minWidth: 1024,
    minHeight: 768,
    icon: "./assets/AppIcon.icns",
    titleBarStyle: "hidden",
    show: false,
    backgroundColor: "#343434"
  });

  win.loadFile("index.html");

  win.on('closed', () => {
    win = null;
  });

  return win;
}

/*
This function creates a frameless window with our "splatter dragon" rotating
and indicates loading. This window is later destroyed with the main window has
loaded 100%.
*/
function createSplash() {
  let splash = new BrowserWindow({
    width: 200,
    height: 200,
    resizable: false,
    icon: "./assets/AppIcon.icns",
    frame: false,
    movable: true,
    backgroundColor: "#343434"
  });

  splash.loadFile("splash.html");

  return splash;
}

app.on("ready", () => {
  // Creates splash loading
  let splash = createSplash();
  // Creates the main window
  mainWindow = createMainWindow();
  /*
  This catched the main window being loaded and ready and destroys the entire
  existance of the splash loading window
  */
  mainWindow.once("ready-to-show", () => {
    splash.close();
    splash = null;
    mainWindow.show();
  });
});

/*
This here is for MacOS only, it makes it so that when the user closes all the
windows the application closes completely leaving no trace
*/
app.on("window-all-closed", () => {
  if (process.platform == "darwin") {
    app.quit();
  }
});

/*
This also is only for MacOS, this triggers when the application is relaunched
from the dock if it wasn't closed
*/
app.on("activate", () => {
  if (mainWindow == null) {
    createWindow();
  }
});

/*
ipcMain handles events triggered by the renderer.js after index.html has been
loaded on the main window, in this case the event is just an event that is sent
from the rendered to the main when the page has fully loaded
*/
ipcMain.on("main-window-ready", () => {
  console.log("Main Window Ready");
});

var modalWindow;

ipcMain.on("new-campaign", () => {
  console.log("New Campaign Event");
  modalWindow = new BrowserWindow({
    parent: mainWindow,
    titleBarStyle: "hidden",
    modal: true,
    show: false,
    backgroundColor: "#343434"
  });

  modalWindow.loadFile("modal.html");

  modalWindow.on("ready-to-show", () => {
    modalWindow.show();
    console.log("Showing Modal");
  });
});

ipcMain.on("new-campaign-will-be-done", (event, data) => {
  modalWindow.close();
  modalWindow = null;
  mainWindow.webContents.send("new-campaign-done");
});