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

const user_path = app.getPath("documents");

const unallowedNames = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
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
    icon: "./assets/AppIcon.png",
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
  // Should check if the data folder exists. If it doesn't we need to create it
  let path = user_path + "/OpenCampaign";
  if (!fs.existsSync(path)) {
    mkdirp(path, () => {
      mkdirp(path + "/campaigns");
      mkdirp(path + "/settings", () => {
        data = {
          profile: "Pedro",
          dev: true
        };
        fs.writeFileSync(path + "/settings/user.json", data);
      });
    });
  }
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
  let path = user_path + "/OpenCampaign/campaigns/";
  // Data to be sent to mainWindow
  let data = [];
  // Tracker for the callback
  let done = 0;
  // Here we read the path and create an array of each directory in it
  fs.readdirSync(path).forEach((file, index, array) => {
    console.log("gamer? " + file);
    // Skip files
    if (file.search(/\./) != -1) {
      done++;
      if (done >= array.length) {
        // Here we send the event trigger to the mainWindow
        mainWindow.webContents.send("main-window-will-be-ready", data);
      }
      return;
    }
    // Then we iterate between each directory and get the JSON of the campaign
    fs.readFile(path + file + "/campaign.json", (err, content) => {
      if (err) throw err;
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
  if (fs.readdirSync(path).length == 0) {
    // Virgin Screen
    mainWindow.webContents.send("first-time-launch");
  } else if (fs.readdirSync(path).length == 1) {

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
  if (splash) {
    splash.close();
    splash = null;
  }
  mainWindow.show();
});

/*
This event triggers when the user tries to create a new campaign.
*/
ipcMain.on("new-campaign-will-be-done", (event, message) => {
  // Replace replaces illegal characters for NTFS and other filesystems
  messageFilter = message.campaignName.replace(/[^a-zA-Z ]/g, "_");
  // Simple Tracker Counter for a callback
  let done = 0;
  /*
  This forEach verifies if the name given is not in the unallowed names list for
  windows systems.
  */
  unallowedNames.forEach((val, i, a) => {
    /*
    This checker is simple, it checks if the name given to the campaign is equals
    to a unallowed name and if it isn't it adds 1 to the done counter. Since it
    doesn't add a 1 to the done tracker then if the done isn't the same lenght
    as the array with all the unallowed names then that means the user put a bad
    name and the new campaign fucked up and should be canceled. If it's the same
    lenght then the process can proceed.
    */
    if (messageFilter == val) {
      mainWindow.webContents.send("new-campaign-fuck");
    } else {
      done++;
    }
    if (done >= a.length) {
      // catch a read error from fs.exists as it might not have permissions
      try {
        // path is simple the directory where the campaigns are and the name
        let path = user_path + "/OpenCampaign/campaigns/" + messageFilter;
        // Check if the directory already exists
        if (fs.existsSync(path)) {
          // If it exists then the new campaign can't be done
          mainWindow.webContents.send("new-campaign-fuck");
        } else {
          // Else create the directory and the file containing basic details
          mkdirp(path, function() {
            data = {
              "campaignName": message.campaignName,
              "campaignShort": "",
              "campaignDescrip": "",
              "classification": "",
              "backstory": "",
              "challengeRating": ""
            };
            // Setup of all the paths needed for storing campaign data
            mkdirp(path + "/spells");
            mkdirp(path + "/treasures");
            mkdirp(path + "/deities");
            mkdirp(path + "/items");
            mkdirp(path + "/encounters");
            mkdirp(path + "/npcs");
            mkdirp(path + "/notes");
            fs.writeFile(path + "/campaign.json", JSON.stringify(data), function() {
              // Then send the done trigger to the mainWindow
              mainWindow.webContents.send("new-campaign-done", data);
            });
          });
        }
      } catch (e) {
        console.log(e);
      }
    }
  });
});

ipcMain.on("will-open-campaign", (event, message) => {
  // Replace replaces illegal characters for NTFS and other filesystems
  messageFilter = message.campaignName.replace(/[^a-zA-Z ]/g, "_");
  // Path for the selected campaign
  let path = user_path + "/OpenCampaign/campaigns/" + messageFilter;
  fs.readFile(path + "/campaign.json", (err, content) => {
    try {
      // Here we try and parse the JSON as to send it to store it on our data
      let data = JSON.parse(content);
      // Here we send the event trigger to the mainWindow
      mainWindow.webContents.send("open-campaign", data);
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

ipcMain.on("will-open-help", () => {
  mainWindow.webContents.send("open-help");
});
