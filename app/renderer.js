// This script only runs after the program is loaded :D
const electron = require('electron');
const {
  ipcRenderer
} = electron;
const $ = require("jquery");

/*
ipcRenderer sends a trigger to the main app js so it can perform a backend event
This is quite a simple one, it sends a trigger when the renderer has fully
loaded called main-window-ready
*/
ipcRenderer.send("main-window-loading");

// This triggers after the campaigns have been processed by main
ipcRenderer.on("main-window-will-be-ready", (event, message) => {
  // Basic callback tracker
  let done = 0;
  if (message.length == 0) {
    ipcRenderer.send("will-open-help");
    ipcRenderer.send("main-window-ready");
  } else {
    ipcRenderer.send("will-open-help");
    message.forEach((e) => {
      // Append each campaign to the list with the correct names.
      let campaignHTML = $("#templates .campaign-list-item").clone();
      $(campaignHTML).find(".campaign-list-item-name").text(e.campaignName);
      $(campaignHTML).addClass("clickable");
      $(".campaign-list").append(campaignHTML);
      done++;
      // Callback activated when all the items have been appended
      if (done >= message.length) {
        ipcRenderer.send("main-window-ready");
      }
    });
  }
});

function startLoading() {
  $("div.loading-bar .bar-fill").css("opacity", 1.0);
  $("div.loading-bar .bar-fill").css("height", "0%");
}

function setLoading(percentage) {
  $("div.loading-bar .bar-fill").css("height", percentage + "%");
}

function stopLoading() {
  setTimeout(function() {
    $("div.loading-bar .bar-fill").css("opacity", 0.0);
    $("div.loading-bar .bar-fill").css("height", "0%");
  }, 300);
}

/*
Since first time launch has no stuff to load the window just sends a the ready
event to the main process
*/
ipcRenderer.on("first-time-launch", (event) => {
  ipcRenderer.send("will-open-help");
  ipcRenderer.send("main-window-ready");
});

// This is for when the user wants to load a campaign
$("div.campaign-list").on("click", ".campaign-list-item.clickable", function() {
  // Collect data
  let data = {
    "campaignName": $(this).find(".campaign-list-item-name").text()
  };
  // Send trigger to main
  ipcRenderer.send("will-open-campaign", data);
});

ipcRenderer.on("open-campaign", (event, message) => {
  console.log(message);
  $(".help").hide("fast")
  $(".campaign-details").show("fast")
});

/*
Whenever the help button is pressed, this function triggers. For some reason I
called the button #opencampaign
*/
$("#opencampaignHelp").click(function() {
  /*
  This sends the message to the main process to read the help.md file and
  produce html
  */
  ipcRenderer.send("will-open-help");
});

// This triggers when the main process has finished processing the help.md file
ipcRenderer.on("open-help", (event, content) => {
  // Put the contect of the help.md in html on the help section of the app
  $(".help").html(content);
  $(".campaign-details").hide("fast")
  $(".help").show("fast")
});

/*
This part is about creating a new campaign and the files for it.

Creating a new campaign works like this:
1. User clicks the new campaign button
2. Renderer creates the HTML object for user to input the name of the campaign
3. User presses ENTER (key 13) to finalize creation
4. Renderer makes the HTML object not editable and clickable
5. Renderer saves the object to a temporary variable
6. Renderer sends information to Main
7. Main confirms the information and saves information
*/

// This is the temporary variable to share the HTML object between functions
var tempCampaignHTML;

/*
This function is to create, edit and add the button for a new campaign and
callback the function with the HTML as parameters
*/
function newCampaign(callback) {
  // Create button from template
  let campaignHTML = $("#templates .campaign-list-item").clone();
  // Change the text to "Campaign Name Here"
  $(campaignHTML).find(".campaign-list-item-name").text("Campaign Name Here");
  // Make the button editable
  $(campaignHTML).find(".campaign-list-item-name").prop("contenteditable", true);
  // Append the object to the campaign list
  $(".campaign-list").append(campaignHTML);
  // Focus the User's cursor to the button
  $(campaignHTML).find(".campaign-list-item-name").focus();
  // Wait for the user to complete the name and press ENTER (key 13)
  $(campaignHTML).on("keypress", (e) => {
    if (e.which == 13) {
      // Make the object nolonger editable and clickable
      $(campaignHTML).find(".campaign-list-item-name").prop("contenteditable", false);
      $(campaignHTML).addClass("clickable");
      // Set the temporary variable to the new HTML object
      tempCampaignHTML = campaignHTML;
      // Set and send the data (name of the campaign) to the callback function
      let data = $(campaignHTML).find(".campaign-list-item-name").text();
      callback(data);
    }
  });
}

/*
This is a listener for the event of clicking a new campaign. Clicking that button
should send Main the message to create a new folder for the campaign.
*/
$("#newCampaign").click(function() {
  /*
  Call the new campaign function and wait for callback with the name of the new
  campaign
  */
  newCampaign((name) => {
    // Store the name of the campaign as a JSON object
    data = {
      "campaignName": name
    };
    console.log(data);
    // Send that data to Main
    ipcRenderer.send("new-campaign-will-be-done", data);
  });
});

// Wait for the positive response from Main
ipcRenderer.on("new-campaign-done", (event, data) => {
  ipcRenderer.send("will-open-campaign", data);
});

// Wait for the failiure response from Main
ipcRenderer.on("new-campaign-fuck", (event) => {
  $(tempCampaignHTML).remove();
  tempCampaignHTML = null;
});

/*

*/