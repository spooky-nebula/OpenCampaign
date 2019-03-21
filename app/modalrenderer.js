// This script only runs after the program is loaded :D
const electron = require('electron');
const {
  ipcRenderer
} = electron;
const $ = require("jquery");

$("#done").click(function() {
  let data = {
    "campaignName": $("#campaignName").val(),
    "campaignShort": $("#campaignShort").val()
  };
  ipcRenderer.send("new-campaign-will-be-done", data);
});
