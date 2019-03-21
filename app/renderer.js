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
ipcRenderer.send("main-window-ready");

function newCampaign() {
  ipcRenderer.send("new-campaign");
}

$("#newCampaign").click(function() {
  newCampaign();
});

function loadCampaigns() {
  let campaignHTML = $("#templates .campaign-list-item").clone();
  $(campaignHTML).find(".campaign-list-item-name").text("data.campaignName");
  $(".campaign-list").append(campaignHTML);
}

ipcRenderer.on("new-campaign-done", () => {
  loadCampaigns();
});
