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
      $(campaignHTML).prop("folderName", e.folderName);
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

// This triggers when the main process has finished processing the help.md file
ipcRenderer.on("open-help", (event, content) => {
  // Put the contect of the help.md in html on the help section of the app
  $(".help").html(content);
  $(".campaign-details").hide("fast");
  $(".help").show("fast");
});

/*
This part is about editing details about the campaign.
*/

/*
For some reason, I am unable to add custom properties directly in the index.html
and so have to initiate them in here like they are variables.
*/
$("#editMainDetails").prop("editing", "false");
$("#deleteCampaign").prop("confirm", "false");

$("#editMainDetails").click(function() {
  switch ($("#editMainDetails").prop("editing")) {
    case "false":
      $("#editMainDetails").prop("editing", "true");
      $("#editMainDetails").css("background", "#cb262c");
      $("#editMainDetails").text("✅ Edit Done");

      $(".campaign-main .campaign-name p").prop("contenteditable", true);
      $(".campaign-main .campaign-challenge-rating p").prop("contenteditable", true);
      $(".campaign-main .campaign-classification p").prop("contenteditable", true);
      $(".campaign-main .campaign-description p").prop("contenteditable", true);
      break;
    case "true":
      $("#editMainDetails").prop("editing", "false");
      $("#editMainDetails").css("background", "#121212");
      $("#editMainDetails").text("🖊 Edit Details");

      $(".campaign-main .campaign-name p").prop("contenteditable", false);
      $(".campaign-main .campaign-challenge-rating p").prop("contenteditable", false);
      $(".campaign-main .campaign-classification p").prop("contenteditable", false);
      $(".campaign-main .campaign-description p").prop("contenteditable", false);

      let data = {
        "campaignName": $(".campaign-main .campaign-name p").text(),
        "challengeRating": $(".campaign-main .campaign-challenge-rating p").text(),
        "classification": $(".campaign-main .campaign-classification p").text(),
        "campaignDescrip": $(".campaign-main .campaign-description p").text(),
        "campaignShort": "",
        "folderName": $(".campaign-main").prop("folderName")
      };

      ipcRenderer.send("edit-campaign-will-be-done", data);
      break;
    default:
      $("#editMainDetails").prop("editing", "false");
      $("#editMainDetails").css("background", "#121212");
      $("#editMainDetails").text("🖊 Edit Details");

  }
});

ipcRenderer.on("edit-campaign-done", (event) => {
  console.log("Edit Done Succesfully");
});

ipcRenderer.on("edit-campaign-fuck", (event) => {
  console.log("Edit Failed Abismally");
});

$("#deleteCampaign").click(function() {
  /*
   */
  switch ($("#deleteCampaign").prop("confirm")) {
    case "false":
      $("#deleteCampaign").prop("confirm", "true");
      $("#deleteCampaign").css("background", "#cb262c");
      $("#deleteCampaign").text("⭕ Confirm? ⭕");
      break;
    case "true":
      $("#deleteCampaign").prop("confirm", "false");
      $("#deleteCampaign").css("background", "#121212");
      $("#deleteCampaign").text("⭕ Delete Campaign");

      let data = {};

      data.folderName = $(".campaign-main").prop("folderName");
      ipcRenderer.send("delete-campaign-will-be-done", data);
      break;
    default:
      $("#deleteCampaign").prop("confirm", "false");
      $("#deleteCampaign").css("background", "#121212");
      $("#deleteCampaign").text("⭕ Delete Campaign");
  }
});

ipcRenderer.on("delete-campaign-done", (event) => {
  console.log("Delete Done Succesfully");

});

ipcRenderer.on("delete-campaign-fuck", (event) => {
  console.log("Delete Failed Abismally");
});