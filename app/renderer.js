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

ipcRenderer.on("main-window-will-be-ready", (event, message) => {
  ipcRenderer.send("main-window-ready");
});

ipcRenderer.on("first-time-launch", (event) => {
  ipcRenderer.send("main-window-ready");
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
      tempCampaignHTML = campaignHTML;
      callback($(campaignHTML).find(".campaign-list-item-name").text());
    }
  });

}

$(".campaign-list-item:not(#opencampaign)").click(function() {
  let data = {
    "campaignName": $(this).find(".campaign-list-item-name").text()
  };
  ipcRenderer.send("will-open-campaign", data);
  ipcRenderer.once("open-campaign", (event, message) => {
    console.log(message);
  });
});

$("#opencampaign").click(function() {
  console.log("Gamer");
});

$("#newCampaign").click(function() {
  newCampaign((name) => {
    data = {
      "campaignName": name
    };
    console.log(data);
    ipcRenderer.send("new-campaign-will-be-done", data);
  });
});

function loadCampaigns() {
  let campaignHTML = $("#templates .campaign-list-item").clone();
  $(campaignHTML).find(".campaign-list-item-name").text("data.campaignName");
  $(".campaign-list").append(campaignHTML);
}

ipcRenderer.on("new-campaign-done", (event) => {
  loadCampaigns();
});

ipcRenderer.on("new-campaign-fuck", (event) => {
  $(tempCampaignHTML).remove();
  tempCampaignHTML = null;
});