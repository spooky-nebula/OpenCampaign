// Common requires of Electron
const electron = require('electron');
const {
  app,
  BrowserWindow,
  ipcMain
} = electron;
const fs = require('fs');
const mkdirp = require('mkdirp');

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

function createErrorWindow(callback) {

  let win = new BrowserWindow({
    width: 400,
    height: 200,
    icon: "./assets/AppIcon.icns",
    show: true,
    backgroundColor: "#343434"
  });

  win.on('closed', () => {
    callback();
  });
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

var splash;

app.on("ready", () => {
  // Creates splash loading
  splash = createSplash();
  // Creates the main window
  mainWindow = createMainWindow();
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
loaded on the main window.
*/

/*
Loading all the campaigns and sending the array to the mainWindow so the it can
build a list of the campaigns.
*/
ipcMain.on("main-window-loading", (event) => {
  // Path for the campaigns
  let path = "./data/campaigns/";
  // Data to be sent to mainWindow
  let data = [];
  // Tracker for the callback
  let done = 0;
  // Here we read the path and create an array of each directory in it
  fs.readdirSync(path).forEach((file, index, array) => {
    // Then we iterate between each directory and get the JSON of the campaign
    fs.readFile(path + file + "/campaign.json", (err, content) => {
      try {
        // Here we try and parse the JSON as to send it to store it on our data
        data.push(JSON.parse(content));
        // done++ updates the tracker
        done++;
        /*
        When done is the size of the array of campaigns that means it has read
        all values and processed them and is ready to send them to the mainWindow
        */
        if (done >= array.length) {
          // Here we send the event trigger to the mainWindow
          mainWindow.webContents.send("main-window-will-be-ready", data);
        }
      } catch (e) {
        /*
        This is made in case the JSON has an error parsing then we gotta quit
        the app as it is useless if it can't load the data needed
        */
        console.error(e);
        // Create error window
        createErrorWindow(function() {
          // Quit the application
          app.quit();
        });
      }
    });
  });
  // If there is nothing in the data then it must be the first time
  if (data.length == 0) {
    // Virgin Screen
    mainWindow.webContents.send("first-time-launch");
  }
});

/*
This ipcMain the event is just an event that is sent
from the rendered to the main when the page has fully loaded and ready
*/
ipcMain.on("main-window-ready", (event) => {
  /*
  This catched the main window being loaded and ready and destroys the entire
  existance of the splash loading window
  */
  splash.close();
  splash = null;
  mainWindow.show();
});

ipcMain.on("new-campaign-will-be-done", (event, message) => {
  console.log("1");
  try {
    let path = "./data/campaigns/" + message.campaignName;
    console.log(path);
    if (fs.existsSync(path)) {
      console.log("2");
      mainWindow.webContents.send("new-campaign-fuck");
    } else {
      mkdirp(path, function() {
        console.log("3");
        data = {
          "campaignName": message.campaignName,
          "campaignShort": "",
          "campaignDescrip": ""
        };
        fs.writeFile(path + "/campaign.json", JSON.stringify(data), function() {
          mainWindow.webContents.send("new-campaign-done");
        });
      });
    }
  } catch (e) {
    console.log(e);
  }
});

ipcMain.on("will-open-campaign", (event, message) => {
  mainWindow.webContents.send("open-campaign");
});
