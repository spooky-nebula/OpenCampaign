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

/*
Since first time launch has no stuff to load the window just sends a the ready
event to the main process
*/
ipcRenderer.on("first-time-launch", (event) => {
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
$("#opencampaign").click(function() {
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
});

var tempCampaignHTML;

function newCampaign(callback) {
  let campaignHTML = $("#templates .campaign-list-item").clone();
  $(campaignHTML).find(".campaign-list-item-name").text("Campaign Name Here");
  $(campaignHTML).find(".campaign-list-item-name").prop("contenteditable", true);
  $(".campaign-list").append(campaignHTML);
  $(campaignHTML).find(".campaign-list-item-name").focus();
  $(campaignHTML).on("keypress", (e) => {
    if (e.which == 13) {
      $(campaignHTML).find(".campaign-list-item-name").prop("contenteditable", false);
      $(campaignHTML).addClass("clickable");
      tempCampaignHTML = campaignHTML;
      let data = $(campaignHTML).find(".campaign-list-item-name").text();
      callback(data);
    }
  });
}

$("#newCampaign").click(function() {
  newCampaign((name) => {
    data = {
      "campaignName": name
    };
    console.log(data);
    ipcRenderer.send("new-campaign-will-be-done", data);
  });
});

ipcRenderer.on("new-campaign-done", (event, data) => {
  ipcRenderer.send("will-open-campaign", data);
});

ipcRenderer.on("new-campaign-fuck", (event) => {
  $(tempCampaignHTML).remove();
  tempCampaignHTML = null;
});
