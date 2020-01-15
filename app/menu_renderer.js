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
ipcRenderer.send("menu-window-loading");

// This triggers after the campaigns have been processed by main
ipcRenderer.on("menu-window-will-be-ready", (event, message) => {
  // Basic callback tracker
  let done = 0;
  if (message.length == 0) {
    ipcRenderer.send("will-open-help");
    ipcRenderer.send("menu-window-ready");
  } else {
    ipcRenderer.send("will-open-help");
    message.forEach((e) => {
      // Append each campaign to the list with the correct names.
      let campaignHTML = $("#templates .campaign-list-item").clone();
      $(campaignHTML).find(".campaign-list-item-name").text(e.campaignName);
      $(campaignHTML).prop("folderName", e.folderName);
      $(campaignHTML).addClass("clickable");
      $(".campaign-list").append(campaignHTML);
      done++;
      // Callback activated when all the items have been appended
      if (done >= message.length) {
        ipcRenderer.send("menu-window-ready");
      }
    });
  }
});

/*
Since first time launch has no stuff to load the window just sends a the ready
event to the main process
*/
ipcRenderer.on("first-time-launch", (event) => {
  ipcRenderer.send("will-open-help");
  ipcRenderer.send("menu-window-ready");
});

// This is for when the user wants to load a campaign
$("div.campaign-list").on("click", ".campaign-list-item.clickable", function() {
  startLoading();
  // Collect data
  let data = {
    "campaignName": $(this).prop("folderName")
  };
  setLoading(5);
  // Send trigger to main
  ipcRenderer.send("will-open-campaign", data);
});

ipcRenderer.on("open-campaign", (event, message) => {
  setLoading(50);
  console.log(message);
  // Store original campaign folder name
  $(".campaign-main").prop("folderName", message.folderName);
  // Start changing values
  $(".campaign-name p").text(message.campaignName);
  $(".campaign-short p").text(message.campaignShort);
  $(".campaign-description p").text(message.campaignDescrip);
  $(".campaign-challenge-rating p").text(message.challengeRating);
  $(".campaign-classification p").text(message.classification);
  // End changing values and present to User
  $(".help").hide("fast");
  $(".campaign-details").show("fast");
  setLoading(100);
  stopLoading();
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

/*
This part is about creating a new campaign and the files for it.

Creating a new campaign works like this:
1. User clicks the new campaign button
2. MenuRenderer creates the HTML object for user to input the name of the campaign
3. User presses ENTER (key 13) to finalize creation
4. MenuRenderer makes the HTML object not editable and clickable
5. MenuRenderer saves the object to a temporary variable
6. MenuRenderer sends information to Main
7. Main confirms the information and saves information
*/

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

// Wait for the positive response from Main
ipcRenderer.on("new-campaign-done", (event, data) => {
  $(tempCampaignHTML).prop("folderName", data.folderName);
  data.campaignName = data.folderName;
  ipcRenderer.send("will-open-campaign", data);
});

// Wait for the failiure response from Main
ipcRenderer.on("new-campaign-fuck", (event) => {
  $(tempCampaignHTML).remove();
  tempCampaignHTML = null;
});
